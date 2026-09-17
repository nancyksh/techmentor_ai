import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

// LLM replies often contain Markdown (bold, lists, code). Render it instead of showing raw ** and ```.
// Styling is inherited from the parent so it fits each panel.
export default function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`space-y-2 break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          h1: ({ children }) => <p className="font-semibold text-white">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-white">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-white">{children}</p>,
          pre: ({ children }) => (
            <pre className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto text-xs font-mono">{children}</pre>
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[0.9em] font-mono">{children}</code>
            ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-indigo-300">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
