
import Alert from './Alert'

export default function SampleDataNotice({ children }) {
  return (
    <Alert tone="info">
      <strong className="font-semibold">Workspace information.</strong>{' '}
      {children ??
        'Project information and activity are retrieved from the KnowFlow backend. Demo accounts use prepared project records for demonstration.'}
    </Alert>
  )
}
