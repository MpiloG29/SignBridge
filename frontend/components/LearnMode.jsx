import { useMemo, useState } from "react";
import { SASL_CATEGORIES, SIGN_DICTIONARY } from "../data/saslSigns";

export default function LearnMode() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return SASL_CATEGORIES.map((cat) => ({
      ...cat,
      signs: cat.signs.filter(
        (sign) => sign.toLowerCase().includes(q) || (SIGN_DICTIONARY[sign] || "").toLowerCase().includes(q)
      )
    })).filter((cat) => cat.signs.length);
  }, [query]);

  return (
    <section className="panel">
      <h3>Learn SASL Signs</h3>
      <input
        className="input"
        placeholder="Search sign name or description"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="learn-grid">
        {filtered.map((cat) => (
          <article key={cat.name} className="card">
            <h4>{cat.name}</h4>
            <ul>
              {cat.signs.map((sign) => (
                <li key={sign}>
                  <strong>{sign}</strong> — {SIGN_DICTIONARY[sign] || "Description to be recorded"}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
