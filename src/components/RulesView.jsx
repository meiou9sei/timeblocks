export default function RulesView({ rules, onChange }) {
  return (
    <div className="rules-view">
      <div className="rules-view-header">
        <span className="rules-view-title">YOUR RULES</span>
      </div>
      <textarea
        className="rules-textarea"
        value={rules}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write down the rules you're holding yourself to this month..."
        maxLength={4000}
      />
    </div>
  )
}
