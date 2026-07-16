import Nav from './components/Nav'
import Hero from './components/Hero'
import RoundBoard from './components/RoundBoard'
import BuyPanel from './components/BuyPanel'
import HowItWorks from './components/HowItWorks'
import Winners from './components/Winners'
import Stats from './components/Stats'
import Footer from './components/Footer'
import { useRound } from './lib/useRound'
import { useWallet } from './lib/useWallet'

export default function App() {
  const round = useRound()
  const wallet = useWallet()

  return (
    <div className="min-h-screen px-3 sm:px-6">
      <Nav wallet={wallet} />
      <main>
        <Hero round={round} />
        <RoundBoard round={round} />
        <BuyPanel round={round} wallet={wallet} />
        <HowItWorks />
        <Winners round={round} />
        <Stats round={round} />
      </main>
      <Footer />
    </div>
  )
}
