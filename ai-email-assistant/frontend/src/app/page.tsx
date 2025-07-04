'use client'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

type Tone =
  | 'Formal'
  | 'Friendly'
  | 'Persuasive'
  | 'Diplomatic'
  | 'Appreciative'
  | 'Urgent'
  | 'Apologetic'
  | 'Congratulatory'
  | 'Empathetic'
  | 'Instructional'
  | 'Collaborative'
  | 'Direct'
  | 'Conversational'
  | 'Professional'
  | 'Assertive'
  | 'Cautious'
  | 'Enthusiastic'
  | 'Requestive';

const toneColors: Record<Tone, string> = {
  Formal: '#e0f2fe', Friendly: '#fce7f3', Persuasive: '#ede9fe', Diplomatic: '#fef9c3', Appreciative: '#dcfce7', Urgent: '#fee2e2', Apologetic: '#fef3c7', Congratulatory: '#dbeafe', Empathetic: '#fef2f2', Instructional: '#ede9fe', Collaborative: '#f0fdf4', Direct: '#f3f4f6', Conversational: '#fff7ed', Professional: '#f1f5f9', Assertive: '#fef2f2', Cautious: '#fef9c3', Enthusiastic: '#e0f2fe', Requestive: '#ede9fe',
}

const toneDescriptions: Record<Tone, string> = {
  Formal: "Formal tone is suitable for professional and business communications. It maintains a respectful and concise tone.",
  Friendly: "Friendly tone is warm and casual, ideal for personal and approachable communication. It can include emojis and informal language.",
  Persuasive: "Persuasive tone is used to influence the reader with compelling arguments and motivational phrases.",
  Diplomatic: "Diplomatic tone helps in handling sensitive matters tactfully and respectfully.",
  Appreciative: "Appreciative tone expresses gratitude and recognition in a warm and sincere manner.",
  Urgent: "Urgent tone conveys importance and prompts immediate action.",
  Apologetic: "Apologetic tone expresses regret or an apology in a humble and sincere way.",
  Congratulatory: "Congratulatory tone is used to celebrate someone’s achievement or milestone.",
  Empathetic: "Empathetic tone shows understanding and compassion towards someone’s feelings or situation.",
  Instructional: "Instructional tone is used to clearly explain steps or processes.",
  Collaborative: "Collaborative tone emphasizes teamwork and cooperative language.",
  Direct: "Direct tone gets straight to the point and minimizes fluff.",
  Conversational: "Conversational tone mimics casual spoken language and helps build rapport.",
  Professional: "Professional tone maintains formality and credibility in business communication.",
  Assertive: "Assertive tone communicates confidence without being aggressive.",
  Cautious: "Cautious tone is reserved, careful, and avoids strong claims or commitments.",
  Enthusiastic: "Enthusiastic tone expresses excitement and positive energy.",
  Requestive: "Requestive tone is polite and used to ask for something clearly and respectfully.",
}

const allLanguages = ['Arabic','Bengali','Chinese','Czech','Dutch','English','French','German','Greek','Gujarati','Hebrew','Hindi','Indonesian','Italian','Japanese','Kannada','Korean','Malay','Marathi','Nepali','Persian','Polish','Portuguese','Punjabi','Romanian','Russian','Spanish','Swedish','Tamil','Telugu','Thai','Turkish','Ukrainian','Urdu','Vietnamese']

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<Tone>('Formal' as Tone)
  const [language, setLanguage] = useState('English')
  const [recipient, setRecipient] = useState('')
  const [sender, setSender] = useState('')
  // const [attachmentMention, setAttachmentMention] = useState(false)
  const [useBullets, setUseBullets] = useState(false)
  const [shortEmail, setShortEmail] = useState(false)
  const [useEmojis, setUseEmojis] = useState(false)
  const [subject, setSubject] = useState('')
  const [editableBody, setEditableBody] = useState('')
  const [backendStatus, setBackendStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  type EmailHistoryItem = {
    subject: string;
    tone: string;
    prompt?: string;
    // Add other fields if needed
  };
  const [history, setHistory] = useState<EmailHistoryItem[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  const generateEmail = async () => {
    setLoading(true)
    const refinedPrompt = `Write a ${tone} email in ${language} from ${sender || 'me'} to ${recipient || 'recipient'}. ${prompt}. ${useBullets ? 'Use bullet points.' : ''} ${shortEmail ? 'Keep it under 100 words.' : ''} ${useEmojis && tone === 'Friendly' ? 'Include emojis.' : ''}`

    try {
      const res = await fetch('http://localhost:8000/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: refinedPrompt, tone })
      })
      const data = await res.json()
      const generated = data.generated_email || data.error || 'No response received.'
      const parts = generated.split('\n\n')
      setSubject(parts[0] || '')
      setSubject(parts[0] || '')
      const emailBody = parts.slice(1).join('\n\n') || ''
      setEditableBody(emailBody)
      // Save to DB
      await fetch('http://localhost:8000/save-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: parts[0] || '', body: emailBody, tone, sender, recipient })
      })
    } catch {
      alert('Something went wrong while generating the email.')
    } finally {
      setLoading(false)
    }
  }
const fetchHistory = () => {
    fetch('http://localhost:8000/email-history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("Fetch error:", err));
  }

  const clearHistory = async () => {
    const confirmed = confirm("Are you sure you want to delete all email history?")
    if (!confirmed) return

    await fetch('http://localhost:8000/clear-history', {
      method: 'DELETE'
    })
    fetchHistory()
  }
useEffect(() => {
  fetch('http://localhost:8000/')
    .then(res => res.json())
    .then(data => setBackendStatus(data.message))
    .catch(() => setBackendStatus('⚠️ Backend not reachable'))
}, []);

useEffect(() => {
  fetch('http://localhost:8000/email-history')
    .then(res => res.json())
    .then(data => {
      console.log("History:", data);
      setHistory(data);
    })
    .catch(err => console.error("Fetch error:", err));
}, []);


  const downloadEmail = (format: string) => {
    const content = `${subject}\n\n${editableBody}`
    const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'message/rfc822' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `email.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const speakEmail = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${subject}. ${editableBody}`)
    utterance.lang =
      language === 'Hindi' ? 'hi-IN' :
      language === 'Spanish' ? 'es-ES' :
      language === 'French' ? 'fr-FR' :
      language === 'German' ? 'de-DE' :
      language === 'Japanese' ? 'ja-JP' :
      'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    speechSynthesis.speak(utterance)
  }

  const containerBg = toneColors[tone as Tone] || '#f8fafc';
  const onDrop = (acceptedFiles: File[]) => setAttachment(acceptedFiles[0]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 transition-all duration-300">
      <div className="p-6 max-w-2xl mx-auto rounded-xl shadow-xl" style={{ backgroundColor: containerBg }}>
        <h1 className="text-3xl font-bold mb-2">AI Email Assistant</h1>
        <p className="text-sm mb-4">{backendStatus}</p>

        <input className="w-full border p-2 mb-2 rounded" placeholder="Recipient's Name" value={recipient} onChange={e => setRecipient(e.target.value)} />
        <input className="w-full border p-2 mb-2 rounded" placeholder="Your Name / Signature" value={sender} onChange={e => setSender(e.target.value)} />
        <textarea className="w-full border p-2 mb-2 rounded" rows={3} placeholder="Custom content / notes for the email..." value={prompt} onChange={e => setPrompt(e.target.value)} />

        <select className="w-full border p-2 mb-2 rounded" value={tone} onChange={e => setTone(e.target.value as Tone)}>
          {Object.keys(toneColors).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <p className="text-sm italic mb-4">{toneDescriptions[tone]}</p>

        <select className="w-full border p-2 mb-4 rounded" value={language} onChange={e => setLanguage(e.target.value)}>
          {allLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Simulated Attachment:</label>
          <div {...getRootProps()} className="border-dashed border-2 p-4 rounded text-center cursor-pointer bg-white">
            <input {...getInputProps()} />
            {isDragActive ? <p>Drop the file here ...</p> : <p>Drag & drop a file here, or click to select</p>}
            {attachment && <div className="text-green-700 mt-2"><p>📎 {attachment.name}</p><button onClick={() => setAttachment(null)} className="text-red-600 font-bold">✖</button></div>}
          </div>
        </div>

        <label className="block mb-2"><input type="checkbox" checked={useBullets} onChange={e => setUseBullets(e.target.checked)} /> Use bullet points</label>
        <label className="block mb-2"><input type="checkbox" checked={shortEmail} onChange={e => setShortEmail(e.target.checked)} /> Keep under 100 words</label>
        <label className="block mb-4"><input type="checkbox" checked={useEmojis} onChange={e => setUseEmojis(e.target.checked)} /> Add emojis</label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={generateEmail} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Email'}
        </button>

        {subject && (
          <div className="mt-6">
            <h2 className="font-semibold mb-1">Subject:</h2>
            <p className="mb-4 p-2 border rounded bg-white">{subject}</p>
            <h2 className="font-semibold mb-1">Body:</h2>
            <textarea className="w-full p-3 border rounded bg-white mb-2" rows={6} value={editableBody} onChange={e => setEditableBody(e.target.value)} />

            <div className="flex flex-wrap gap-3 mt-2">
             
              <button onClick={() => downloadEmail('txt')} className="bg-green-600 text-white px-3 py-1 rounded">Save as .txt</button>
              <button onClick={() => downloadEmail('eml')} className="bg-green-800 text-white px-3 py-1 rounded">Save as .eml</button>
            </div>

            <div className="mt-4">
             <button
  onClick={speakEmail}
  className="bg-purple-600 text-white px-3 py-1 rounded"
>
  {isSpeaking ? '⏹️ Stop' : '🔊 Hear This Email'}
</button>

            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-bold">📜 Email History</h3>
          <button onClick={clearHistory} className="text-red-500 hover:text-red-700 text-sm" title="Clear all history">🗑️ Clear History</button>
          <ul className="bg-white p-4 rounded border mt-2 max-h-64 overflow-auto text-sm">
            {history.map((email, idx) => (
              <li key={idx} className="mb-3">
                <strong>Subject:</strong> {email.subject}<br />
                <strong>Tone:</strong> {email.tone}<br />
                <strong>Prompt:</strong> {email.prompt || ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
