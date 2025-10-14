import ExpenseDashboard from '@/components/ExpenseDashboard';

export default function Home() {
  console.log('Home renderizando...');
  return (
    <div>
      <h1 style={{ color: 'white' }}>Antes del dashboard</h1>
      <ExpenseDashboard />
      <h1 style={{ color: 'white' }}>Después del dashboard</h1>
    </div>
  );
}