import GameBoard from '@/components/GameBoard'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Header />
      <GameBoard />
    </main>
  )
}