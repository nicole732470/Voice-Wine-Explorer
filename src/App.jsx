import { useState } from "react";
import wines from "./data/wines.json";
import runWineQuery from "./utils/runWineQuery";

const getAvgRating = (ratings) => {
  if (!ratings || ratings.length === 0) return null;

  const scores = ratings
    .map(r => r.score)
    .filter(s => typeof s === "number");

  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return avg.toFixed(1);
};


function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [matchingWines, setMatchingWines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleAsk = async () => {
    try {
      setLoading(true);
      setAnswer("");
      setMatchingWines([]);

      const res = await fetch("http://localhost:3001/api/parse-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer(data.error || "Backend request failed.");
        setMatchingWines([]);
        return;
      }

      const result = runWineQuery(data, wines);
      setAnswer(result.answer);
      setMatchingWines(result.matches);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      
        const wineSummary = result.matches
          .slice(0, 3)
          .map((wine, index) => {
            return `${index + 1}, ${wine.Name}, by ${wine.Producer}, priced at ${wine.Retail} dollars.`;
          })
          .join(" ");
      
        const speechText = wineSummary
          ? `${result.answer} Here are the top matches: ${wineSummary}`
          : result.answer;
      
        const utterance = new SpeechSynthesisUtterance(speechText);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setAnswer("Failed to call backend.");
      setMatchingWines([]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onstart = () => {
      console.log("Voice recognition started");
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      console.log("Transcript:", transcript);
      setQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div>
      <h1>Voice Wine Explorer</h1>
      <p>Number of wines loaded: {wines.length}</p>
  
      <input
        type="text"
        placeholder="Ask a wine question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
  
      <button onClick={handleAsk} disabled={loading || !question.trim()}>
        {loading ? "Thinking..." : "Ask"}
      </button>
  
      <button onClick={handleVoiceInput} disabled={loading || isListening}>
        {isListening ? "Listening..." : "🎤 Speak"}
      </button>
  
      {isListening && <p>Listening... please speak now.</p>}
  
      {answer && (
        <div>
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}
  
      {matchingWines.length > 0 && (
        <div>
          <h3>Matching Wines</h3>
          <ul>
            {matchingWines.map((wine, idx) => (
              <li key={idx}>
                <strong>{wine.Name}</strong> <br />
                Producer: {wine.Producer} <br />
                Country: {wine.Country} <br />
                Region: {wine.Region} <br />
                Price: ${wine.Retail} <br />
                Rating: {wine.professional_ratings?.[0]?.score || "N/A"}<br />
                Varietal: {wine.Varietal} <br />
                Color: {wine.color}
                <hr />
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {!answer && (
        <div>
          <h3>Wine List Preview</h3>
          <ul>
            {wines.slice(0, 5).map((wine, idx) => (
              <li key={idx}>
                <strong>Name:</strong> {wine.Name} <br />
                <strong>Producer:</strong> {wine.Producer} <br />
                <strong>Country:</strong> {wine.Country} <br />
                <strong>Region:</strong> {wine.Region} <br />
                <strong>Retail:</strong> {wine.Retail} <br />
<strong>Rating:</strong> {wine.professional_ratings?.[0]?.score || "N/A"} <br />
                <strong>Varietal:</strong> {wine.Varietal} <br />
                <strong>Color:</strong> {wine.color}
                <hr />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
export default App;