/**
 * Integration tests: the real Express app against a real MongoDB.
 * Cloudinary and Gemini are replaced with stubs (no network, no cost).
 *
 * Run with a THROWAWAY database (its name must contain "test"):
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27017/campus_os_test npm test
 */
require("dotenv").config();
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const TEST_URI = process.env.TEST_MONGO_URI;
const skip = !TEST_URI ? "Set TEST_MONGO_URI to run the API tests" : false;

if (TEST_URI) {
  if (!/test/i.test(TEST_URI)) {
    throw new Error(
      "TEST_MONGO_URI must point to a database whose name contains 'test'.",
    );
  }
  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = TEST_URI;
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret";
}

let mongoose, app, server, baseUrl, cloudinary, gemini;
const destroyed = [];
let destroyResult = "ok";
let geminiCalls = [];

// ---- helpers -------------------------------------------------------------

/** Build a tiny valid single-page PDF containing `text` (selectable, not scanned). */
function makePdf(text) {
  const stream = `BT /F1 12 Tf 50 700 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

/** A valid PDF with no text layer (what a scan looks like to the parser). */
const blankPdf = () => makePdf(" ");

async function call(method, path, { body, form, cookie } = {}) {
  const headers = {};
  let payload;

  if (cookie) headers.cookie = cookie;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload,
  });
  const text = await response.text();

  return {
    status: response.status,
    json: text ? JSON.parse(text) : null,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

function fileForm(name, content, type) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), name);
  return form;
}

async function registerAndLogin(email = "student@example.com") {
  await call("POST", "/api/auth/signup", {
    body: { name: "Test Student", email, password: "secret123" },
  });
  const login = await call("POST", "/api/auth/login", {
    body: { email, password: "secret123" },
  });
  return login.cookie;
}

// ---- lifecycle -----------------------------------------------------------

before(async () => {
  if (skip) return;

  mongoose = require("mongoose");
  cloudinary = require("../config/cloudinary");
  gemini = require("../utils/gemini");

  let uploadCount = 0;
  cloudinary.uploader.upload = async (path, options) => {
    uploadCount += 1;
    return {
      public_id: `campus-os/test-${uploadCount}`,
      secure_url: `https://res.cloudinary.test/campus-os/test-${uploadCount}`,
      resource_type:
        options.resource_type === "auto" ? "image" : options.resource_type,
    };
  };
  cloudinary.uploader.destroy = async (publicId) => {
    destroyed.push(publicId);
    return { result: destroyResult };
  };

  gemini.generateAnswer = async (args) => {
    geminiCalls.push(args);
    return "Stubbed **answer**";
  };

  await mongoose.connect(TEST_URI);
  app = require("../app");
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  if (skip) return;
  await mongoose.connection.dropDatabase();
  destroyed.length = 0;
  destroyResult = "ok";
  geminiCalls = [];
});

after(async () => {
  if (skip) return;
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ---- auth ----------------------------------------------------------------

test("health check works", { skip }, async () => {
  const res = await call("GET", "/api/health");
  assert.equal(res.status, 200);
});

test("signup validates input and rejects duplicates", { skip }, async () => {
  const bad = await call("POST", "/api/auth/signup", {
    body: { name: " ", email: "x", password: "1" },
  });
  assert.equal(bad.status, 400);
  assert.ok(bad.json.message);

  const ok = await call("POST", "/api/auth/signup", {
    body: { name: "Asha", email: "Asha@Example.com", password: "secret123" },
  });
  assert.equal(ok.status, 201);

  const dup = await call("POST", "/api/auth/signup", {
    body: { name: "Asha", email: "asha@example.com", password: "secret123" },
  });
  assert.equal(dup.status, 409);
});

test(
  "login works regardless of email capitalisation (regression)",
  { skip },
  async () => {
    await call("POST", "/api/auth/signup", {
      body: { name: "Asha", email: "asha@example.com", password: "secret123" },
    });

    const login = await call("POST", "/api/auth/login", {
      body: { email: "  ASHA@Example.COM ", password: "secret123" },
    });
    assert.equal(login.status, 200);
    assert.equal(login.json.user.email, "asha@example.com");
    assert.equal(login.json.user.password, undefined);

    const wrong = await call("POST", "/api/auth/login", {
      body: { email: "asha@example.com", password: "nope" },
    });
    assert.equal(wrong.status, 401);
  },
);

test(
  "protected routes need a session; /me returns the user",
  { skip },
  async () => {
    assert.equal((await call("GET", "/api/folder")).status, 401);

    const cookie = await registerAndLogin();
    const me = await call("GET", "/api/auth/me", { cookie });
    assert.equal(me.status, 200);
    assert.equal(me.json.user.name, "Test Student");

    await call("POST", "/api/auth/logout", { cookie });
  },
);

test(
  "errors always use the { message } shape, including unknown routes",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const unknown = await call("GET", "/api/nope", { cookie });
    assert.equal(unknown.status, 404);
    assert.ok(unknown.json.message);

    const badId = await call("PATCH", "/api/folder/not-an-id", {
      cookie,
      body: { name: "x" },
    });
    assert.equal(badId.status, 400);
    assert.ok(badId.json.message);
  },
);

// ---- folders & files -----------------------------------------------------

test("folder create / rename / duplicate / list", { skip }, async () => {
  const cookie = await registerAndLogin();

  const created = await call("POST", "/api/folder", {
    cookie,
    body: { name: "  Maths  " },
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.folder.name, "Maths");

  const dup = await call("POST", "/api/folder", {
    cookie,
    body: { name: "Maths" },
  });
  assert.equal(dup.status, 409);

  const empty = await call("POST", "/api/folder", {
    cookie,
    body: { name: "   " },
  });
  assert.equal(empty.status, 400);

  const renamed = await call(
    "PATCH",
    `/api/folder/${created.json.folder._id}`,
    {
      cookie,
      body: { name: "Physics" },
    },
  );
  assert.equal(renamed.status, 200);
  assert.equal(renamed.json.folder.name, "Physics");

  const list = await call("GET", "/api/folder", { cookie });
  assert.equal(list.json.folders.length, 1);
});

test("users cannot see or touch each other's folders", { skip }, async () => {
  const alice = await registerAndLogin("alice@example.com");
  const bob = await registerAndLogin("bob@example.com");

  const folder = (
    await call("POST", "/api/folder", {
      cookie: alice,
      body: { name: "Private" },
    })
  ).json.folder;

  assert.equal(
    (await call("GET", `/api/folder/${folder._id}/files`, { cookie: bob }))
      .status,
    404,
  );
  assert.equal(
    (await call("DELETE", `/api/folder/${folder._id}`, { cookie: bob })).status,
    404,
  );
  assert.equal(
    (await call("GET", "/api/folder", { cookie: bob })).json.folders.length,
    0,
  );
});

test(
  "upload, list, rename, delete a file; unicode names survive; bad types rejected",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const folder = (
      await call("POST", "/api/folder", { cookie, body: { name: "Notes" } })
    ).json.folder;

    const up = await call("POST", `/api/folder/${folder._id}/files`, {
      cookie,
      form: fileForm("नोट्स.txt", "hello", "text/plain"),
    });
    assert.equal(up.status, 201);
    assert.equal(up.json.file.name, "नोट्स.txt");
    assert.equal(up.json.file.processingStatus, "not_required");
    assert.equal(up.json.file.cloudinaryPublicId, undefined);

    const bad = await call("POST", `/api/folder/${folder._id}/files`, {
      cookie,
      form: fileForm("virus.exe", "MZ", "application/x-msdownload"),
    });
    assert.equal(bad.status, 415);

    const all = await call("GET", "/api/files", { cookie });
    assert.equal(all.json.files.length, 1);
    assert.equal(String(all.json.files[0].folder), folder._id);

    const fileId = up.json.file._id;
    const renamed = await call(
      "PATCH",
      `/api/folder/${folder._id}/files/${fileId}`,
      {
        cookie,
        body: { name: "Week 1 notes.txt" },
      },
    );
    assert.equal(renamed.json.file.name, "Week 1 notes.txt");

    const deleted = await call(
      "DELETE",
      `/api/folder/${folder._id}/files/${fileId}`,
      { cookie },
    );
    assert.equal(deleted.status, 200);
    assert.deepEqual(destroyed, ["campus-os/test-1"]);
    assert.equal(
      (await call("GET", "/api/files", { cookie })).json.files.length,
      0,
    );
  },
);

test(
  "a storage failure keeps the file record instead of orphaning the asset",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const folder = (
      await call("POST", "/api/folder", { cookie, body: { name: "Notes" } })
    ).json.folder;
    const file = (
      await call("POST", `/api/folder/${folder._id}/files`, {
        cookie,
        form: fileForm("a.txt", "x", "text/plain"),
      })
    ).json.file;

    destroyResult = "error";
    const res = await call(
      "DELETE",
      `/api/folder/${folder._id}/files/${file._id}`,
      { cookie },
    );
    assert.equal(res.status, 502);
    assert.equal(
      (await call("GET", "/api/files", { cookie })).json.files.length,
      1,
    );
  },
);

// ---- PDFs, chats, AI -----------------------------------------------------

test(
  "PDFs are indexed on upload; scanned PDFs upload but are marked failed",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const folder = (
      await call("POST", "/api/folder", { cookie, body: { name: "Bio" } })
    ).json.folder;

    const good = await call("POST", `/api/folder/${folder._id}/files`, {
      cookie,
      form: fileForm(
        "cells.pdf",
        makePdf("Mitochondria produce ATP for the cell"),
        "application/pdf",
      ),
    });
    assert.equal(good.status, 201);
    assert.equal(good.json.file.processingStatus, "ready");

    const scanned = await call("POST", `/api/folder/${folder._id}/files`, {
      cookie,
      form: fileForm("scan.pdf", blankPdf(), "application/pdf"),
    });
    assert.equal(scanned.status, 201);
    assert.equal(scanned.json.file.processingStatus, "failed");
  },
);

test(
  "chat flow: create, ask, follow-up uses history, pagination, delete",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const folder = (
      await call("POST", "/api/folder", { cookie, body: { name: "Bio" } })
    ).json.folder;
    const file = (
      await call("POST", `/api/folder/${folder._id}/files`, {
        cookie,
        form: fileForm(
          "cells.pdf",
          makePdf("Mitochondria produce ATP for the cell"),
          "application/pdf",
        ),
      })
    ).json.file;

    const noFiles = await call("POST", "/api/chats", {
      cookie,
      body: { title: "x", files: [] },
    });
    assert.equal(noFiles.status, 400);

    const created = await call("POST", "/api/chats", {
      cookie,
      body: { title: "Cells", files: [file._id] },
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.chat.files[0].name, "cells.pdf"); // populated
    const chatId = created.json.chat._id;

    const first = await call("POST", `/api/chats/${chatId}/messages`, {
      cookie,
      body: { content: "What do mitochondria produce?" },
    });
    assert.equal(first.status, 200);
    assert.equal(first.json.assistantMessage.content, "Stubbed **answer**");
    assert.match(geminiCalls[0].prompt, /Mitochondria produce ATP/);
    assert.match(geminiCalls[0].prompt, /cells\.pdf/);
    assert.equal(geminiCalls[0].history.length, 0);

    // A generic question that matches no keyword still gets document context.
    const generic = await call("POST", `/api/chats/${chatId}/messages`, {
      cookie,
      body: { content: "Summarize this" },
    });
    assert.equal(generic.status, 200);
    assert.match(geminiCalls[1].prompt, /Mitochondria/);
    assert.equal(geminiCalls[1].history.length, 2); // earlier Q + A are sent for context

    const messages = await call(
      "GET",
      `/api/chats/${chatId}/messages?limit=100`,
      { cookie },
    );
    assert.equal(messages.json.messages.length, 4);
    assert.equal(messages.json.messages[0].role, "user");

    assert.equal(
      (await call("GET", `/api/chats/${chatId}/messages?limit=0`, { cookie }))
        .status,
      400,
    );

    const list = await call("GET", "/api/chats", { cookie });
    assert.equal(list.json.chats.length, 1);
    assert.equal(list.json.pagination.total, 1);

    assert.equal(
      (await call("DELETE", `/api/chats/${chatId}`, { cookie })).status,
      200,
    );
    assert.equal(
      (await call("GET", "/api/chats", { cookie })).json.chats.length,
      0,
    );
    // Resource files are NOT removed when a chat is deleted (only AI uploads are).
    assert.equal(
      (await call("GET", "/api/files", { cookie })).json.files.length,
      1,
    );
  },
);

test(
  "deleting a file detaches it from chats and removes its AI data",
  { skip },
  async () => {
    const cookie = await registerAndLogin();
    const folder = (
      await call("POST", "/api/folder", { cookie, body: { name: "Bio" } })
    ).json.folder;
    const upload = (name) =>
      call("POST", `/api/folder/${folder._id}/files`, {
        cookie,
        form: fileForm(name, makePdf(`Content of ${name}`), "application/pdf"),
      });

    const a = (await upload("a.pdf")).json.file;
    const b = (await upload("b.pdf")).json.file;
    const chatId = (
      await call("POST", "/api/chats", {
        cookie,
        body: { title: "Both", files: [a._id, b._id] },
      })
    ).json.chat._id;

    await call("DELETE", `/api/folder/${folder._id}/files/${a._id}`, {
      cookie,
    });
    const DocumentChunk = require("../models/documentChunkModel");
    assert.equal(await DocumentChunk.countDocuments({ file: a._id }), 0);

    const chat = (await call("GET", "/api/chats", { cookie })).json.chats[0];
    assert.deepEqual(
      chat.files.map((f) => f.name),
      ["b.pdf"],
    );

    await call("DELETE", `/api/folder/${folder._id}/files/${b._id}`, {
      cookie,
    });
    const orphan = await call("POST", `/api/chats/${chatId}/messages`, {
      cookie,
      body: { content: "hello?" },
    });
    assert.equal(orphan.status, 400);
    assert.match(orphan.json.message, /deleted/);
  },
);

test(
  "AI upload goes to 'AI Uploads'; deleting its chat deletes the document",
  { skip },
  async () => {
    const cookie = await registerAndLogin();

    const notPdf = await call("POST", "/api/ai/documents", {
      cookie,
      form: fileForm("a.txt", "hi", "text/plain"),
    });
    assert.equal(notPdf.status, 415);

    const fake = await call("POST", "/api/ai/documents", {
      cookie,
      form: fileForm("fake.pdf", "this is not a pdf", "application/pdf"),
    });
    assert.equal(fake.status, 400);
    assert.equal(destroyed.length, 0);

    const up = await call("POST", "/api/ai/documents", {
      cookie,
      form: fileForm(
        "physics.pdf",
        makePdf("Force equals mass times acceleration"),
        "application/pdf",
      ),
    });
    assert.equal(up.status, 201);
    assert.equal(up.json.file.processingStatus, "ready");
    assert.equal(up.json.file.source, "ai_upload");

    const folders = (await call("GET", "/api/folder", { cookie })).json.folders;
    assert.equal(folders[0].name, "AI Uploads");

    const chatId = (
      await call("POST", "/api/chats", {
        cookie,
        body: { title: "Physics", files: [up.json.file._id] },
      })
    ).json.chat._id;

    await call("DELETE", `/api/chats/${chatId}`, { cookie });
    assert.equal(
      (await call("GET", "/api/files", { cookie })).json.files.length,
      0,
    );
    assert.equal(destroyed.length, 1);
  },
);

test("deleting a folder deletes everything inside it", { skip }, async () => {
  const cookie = await registerAndLogin();
  const folder = (
    await call("POST", "/api/folder", { cookie, body: { name: "Semester 1" } })
  ).json.folder;

  for (const name of ["a.txt", "b.txt"]) {
    await call("POST", `/api/folder/${folder._id}/files`, {
      cookie,
      form: fileForm(name, "x", "text/plain"),
    });
  }

  const res = await call("DELETE", `/api/folder/${folder._id}`, { cookie });
  assert.equal(res.status, 200);
  assert.ok(res.json.message);
  assert.equal(destroyed.length, 2);
  assert.equal(
    (await call("GET", "/api/files", { cookie })).json.files.length,
    0,
  );
  assert.equal(
    (await call("GET", "/api/folder", { cookie })).json.folders.length,
    0,
  );
});
