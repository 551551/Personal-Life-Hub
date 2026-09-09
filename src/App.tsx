import { AppRoutes } from './app/routes'
import './styles/tokens.css'
import './App.css'
import { AppPreferences } from './features/settings/AppPreferences'

function App() { return <AppPreferences><AppRoutes /></AppPreferences> }

export default App
