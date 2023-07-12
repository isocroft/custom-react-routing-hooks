import React from 'react'
import ReactDOM from 'react-dom'
// import { BrowserRouter as Router, Route, Link, Prompt } from 'react-router-dom' // ReactJS: v16.8.2, v17.0.2
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Input from './pages/Input'
import InputSub from './pages/InputSub'

import { renderBreadcrumbs } from './helpers'
import { useUnsavedChangesLock, useRoutingMonitor } from './hooks'

const Routes = ({ getUserConfirmation }) => {
  /* @NOTE: Using the `useRoutingMonitor()` ReactJS hook */
  const { getBreadCrumbsList } = useRoutingMonitor({
    documentTitlePrefix: 'Demo - ',
    getUserConfirmation: getUserConfirmation,
    setupPageTitle: false,
    /* onNavigation() gets called each time the route changes */
    onNavigation: (
      history,
      { documentTitle, previousPathname, currentPathname, navigationDirection }
    ) => {
      /* Can setup Hotjar Events API, Segment or Rudderstack analytics here */
      console.log(
        documentTitle,
        previousPathname,
        currentPathname,
        navigationDirection
      )

      if (previousPathname === '/' && currentPathname === '/input') {
        console.log('history: go(-1)')
        history.goBack()
      }
    },
  })

  return (
    <section className="">
      <Route exact path="/" component={Home} />
      <Route
        exact
        path="/input"
        render={() => (
          <Input
            initialValue="horst"
            breadcrumbs={getBreadCrumbsList('/input')}
            renderBreadcrumbs={
              /* render prop to render breadcrumbs for page */
              renderBreadcrumbs
            }
          />
        )}
      />
      <Route
        exact
        path="/input/inner"
        render={() => (
          <InputSub
            breadcrumbs={getBreadCrumbsList('/input/inner')}
            renderBreadcrumbs={
              /* render prop to render breadcrumbs for page */
              renderBreadcrumbs
            }
          />
        )}
      />
    </section>
  )
}

const App = () => {
  /* @NOTE: Using the `useUnsavedChangesLock()` ReactJS hook */
  const { getUserConfirmation } = useUnsavedChangesLock({
    useBrowserPrompt: true,
  })

  return (
    <div className="">
      <Router getUserConfirmation={getUserConfirmation}>
        <ul
          style={{
            textTransform: 'uppercase',
          }}
        >
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/input">Input</Link>
          </li>
          <li>
            <Link to="/input/inner">Inner</Link>
          </li>
        </ul>
        <Routes getUserConfirmation={getUserConfirmation} />
      </Router>
    </div>
  )
}

const rootElement = document.getElementById('root')

ReactDOM.render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  </React.StrictMode>,
  rootElement
)
