import { exampleIdeas } from '../data/examples'
import ExampleCard from './ExampleCard'

// Grid of starter ideas. onPick receives the selected prompt string.
export default function ExampleGrid({ onPick }) {
  return (
    <div>
      <p className="mb-4 text-center text-sm text-slate-400">
        Not sure where to start? Try an example.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {exampleIdeas.map((idea) => (
          <ExampleCard
            key={idea.title}
            title={idea.title}
            description={idea.description}
            onSelect={() => onPick(idea.prompt)}
          />
        ))}
      </div>
    </div>
  )
}
