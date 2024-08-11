import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const OPENAI_BACKEND_URL = 'https://new-backend-rileybrown24.replit.app';
const ANTHROPIC_BACKEND_URL = 'https://apprenticechat.replit.app';
const PERPLEXITY_BACKEND_URL = 'https://backend-for-perplexity-RileyBrown24.replit.app';

interface AIChatProps {
  content: string;
  onChange: (content: string) => void;
}

const fonts = ['Garamond', 'Baskerville', 'Futura', 'Gill Sans', 'Palatino'];

const AIChat: React.FC<AIChatProps> = ({ content, onChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Gill Sans');
  const [error, setError] = useState<string | null>(null);
  const quillRef = useRef<ReactQuill>(null);
  const lastPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.on('text-change', handleTextChange);
    }
  }, []);

  const handleTextChange = () => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const text = quill.getText();
      const openaiMatch = text.match(/\\\\(.*?)\\\\/);
      const anthropicMatch = text.match(/\/\/(.*?)\/\//);
      const perplexityMatch = text.match(/\[\[(.*?)\]\]/);

      if (openaiMatch && openaiMatch[1].trim()) {
        const promptContent = openaiMatch[1].trim();
        const fullContent = text.substring(0, text.lastIndexOf('\\\\'));
        if (promptContent !== lastPromptRef.current) {
          handleAIInteraction(promptContent, fullContent, 'openai');
          lastPromptRef.current = promptContent;
        }
      } else if (anthropicMatch && anthropicMatch[1].trim()) {
        const promptContent = anthropicMatch[1].trim();
        const fullContent = text.substring(0, text.lastIndexOf('//'));
        if (promptContent !== lastPromptRef.current) {
          handleAIInteraction(promptContent, fullContent, 'anthropic');
          lastPromptRef.current = promptContent;
        }
      } else if (perplexityMatch && perplexityMatch[1].trim()) {
        const promptContent = perplexityMatch[1].trim();
        const fullContent = text.substring(0, text.lastIndexOf('[['));
        if (promptContent !== lastPromptRef.current) {
          handleAIInteraction(promptContent, fullContent, 'perplexity');
          lastPromptRef.current = promptContent;
        }
      }
    }
  };

  const handleAIInteraction = async (promptContent: string, fullContent: string, aiType: 'openai' | 'anthropic' | 'perplexity') => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const formattedPrompt = `User asked / ordered: ${promptContent}\n${fullContent}`;
      const response = await fetchAiResponse(formattedPrompt, aiType);
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        if (range) {
          const deleteLength = promptContent.length + (aiType === 'perplexity' ? 4 : 4);
          const startIndex = range.index - deleteLength;
          quill.deleteText(startIndex, deleteLength);
          quill.insertText(startIndex, response);
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setError('Failed to get AI response. Please check your network connection and try again.');
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        if (range) {
          quill.insertText(range.index, `\nAI Error (${aiType}): Failed to get response. Please try again.\n`);
        }
      }
    } finally {
      setIsLoading(false);
      lastPromptRef.current = null;
    }
  };

  const fetchAiResponse = async (prompt: string, aiType: 'openai' | 'anthropic' | 'perplexity'): Promise<string> => {
    let backendUrl;
    switch (aiType) {
      case 'openai':
        backendUrl = OPENAI_BACKEND_URL;
        break;
      case 'anthropic':
        backendUrl = ANTHROPIC_BACKEND_URL;
        break;
      case 'perplexity':
        backendUrl = PERPLEXITY_BACKEND_URL;
        break;
    }
    try {
      console.log(`Sending request to: ${backendUrl}/api/chat (${aiType})`);
      const response = await axios.post(`${backendUrl}/api/chat`, { prompt }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30 seconds timeout
      });
      console.log('Received response:', response.data);
      return response.data.response;
    } catch (error) {
      console.error('Detailed error:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timed out. The server might be overloaded or unreachable.');
        } else if (error.response) {
          throw new Error(`Server responded with status ${error.response.status}: ${error.response.data}`);
        } else if (error.request) {
          throw new Error('No response received from the server. Please check your network connection.');
        }
      }
      throw new Error('An unexpected error occurred. Please try again later.');
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  return (
    <div className="relative w-full h-full">
      <div className="mb-2">
        <label htmlFor="font-select" className="mr-2 text-white">Select Font:</label>
        <select
          id="font-select"
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          className="border rounded px-2 py-1 bg-gray-800 text-white"
        >
          {fonts.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>
      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
        placeholder="Your note content here... (Type \\prompt\\ for OpenAI, //prompt// for Anthropic, or [[prompt]] for Perplexity)"
        className="text-white h-full"
        style={{
          fontFamily: selectedFont,
          fontSize: '18px',
        }}
      />
      <style>
        {`
          .ql-editor {
            font-family: ${selectedFont}, sans-serif;
            font-size: 18px;
            padding: 20px;
            line-height: 1.3;
            color: white;
            background-color: #1f2937;
          }
          .ql-editor p {
            margin-bottom: 0.5em;
          }
          .ql-snow .ql-toolbar {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            border-color: #4b5563;
            background-color: #374151;
          }
          .ql-container.ql-snow {
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            border-color: #4b5563;
          }
          .ql-toolbar .ql-stroke {
            stroke: #e5e7eb;
          }
          .ql-toolbar .ql-fill {
            fill: #e5e7eb;
          }
          .ql-toolbar .ql-picker {
            color: #e5e7eb;
          }
        `}
      </style>
      {isLoading && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
          AI is thinking...
        </div>
      )}
      {error && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default AIChat;