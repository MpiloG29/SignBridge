export default function ConversationUI({ messages }) {
  return (
    <section className="panel">
      <h3>Conversation</h3>
      <div className="conversation">
        {messages.length === 0 && <p className="muted">No messages yet.</p>}
        {messages.map((msg) => (
          <div key={msg.id} className={`bubble ${msg.from}`}>
            <span className="from">{msg.from === "deaf" ? "Deaf/HoH" : "Hearing"}</span>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
