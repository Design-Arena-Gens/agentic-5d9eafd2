'use client'

import { useState } from 'react'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const examples = [
    "Create a modern 5-story apartment building with balconies",
    "Build a Gothic cathedral with tall spires and stained glass windows",
    "Generate a futuristic skyscraper with a twisting design",
    "Make a small cottage with a chimney and windows",
    "Create a warehouse with large garage doors",
    "Build a castle with towers and battlements"
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the building you want to create')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code')
      }

      setGeneratedCode(data.code)
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
    alert('Code copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'blender_building.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🏗️ Blender Building Assistant</h1>
        <p>Generate and modify buildings in Blender using natural language</p>
      </div>

      <div className="main-content">
        <div className="input-section">
          <label htmlFor="prompt">Describe the building you want to create:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a modern office building with 10 floors, glass windows, and a rooftop garden..."
            disabled={loading}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Blender Script'}
          </button>
          {generatedCode && (
            <button className="btn btn-secondary" onClick={handleDownload}>
              Download Script
            </button>
          )}
        </div>

        {loading && (
          <div className="loading">
            ⚙️ Generating your Blender Python script...
          </div>
        )}

        {generatedCode && (
          <div className="output-section">
            <h2>Generated Blender Python Script:</h2>
            <div className="code-output">
              <button className="copy-btn" onClick={handleCopy}>
                Copy
              </button>
              <pre>{generatedCode}</pre>
            </div>
          </div>
        )}

        <div className="examples">
          <h3>💡 Example Prompts (Click to use):</h3>
          <div className="example-list">
            {examples.map((example, index) => (
              <div
                key={index}
                className="example-item"
                onClick={() => setPrompt(example)}
              >
                {example}
              </div>
            ))}
          </div>
        </div>

        <div className="instructions">
          <h3>📋 How to Use in Blender:</h3>
          <ol>
            <li>Copy or download the generated Python script</li>
            <li>Open Blender</li>
            <li>Switch to the <code>Scripting</code> workspace</li>
            <li>Click <code>New</code> to create a new script</li>
            <li>Paste the generated code</li>
            <li>Click <code>Run Script</code> (▶️) or press <code>Alt+P</code></li>
            <li>Your building will appear in the 3D viewport!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
