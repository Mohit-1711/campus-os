import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";
import "./ComingSoonPage.css";

/** Roadmap page for modules that are planned but not built yet. */
export default function ComingSoonPage({ module }) {
  return (
    <div className="coming-soon">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">{module.eyebrow}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
        <span className="chip chip--info">Coming soon</span>
      </header>

      <section className="card coming-soon__plan">
        <h2 className="section-title">What's planned</h2>
        <ol>
          {module.plan.map(([title, description], index) => (
            <li key={title}>
              <span className={`tile tile--${module.accent}`}>{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Link to="/" className="btn btn--secondary">
        <Icon name="chevronLeft" size={16} /> Back to overview
      </Link>
    </div>
  );
}
