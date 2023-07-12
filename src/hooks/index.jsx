import React, { useContext, useState, useEffect } from 'react'
import aes from 'crypto-js/aes'
import encoding from 'crypto-js/enc-utf8'
import { useHistory, useLocation } from 'react-router-dom'

const ENC_KEY = 'u450oidejt606j' // DEMO: not safe in plain sight - especially on frontend

// interface BrowserStorage {
//   getFromStorage<T extends unknown>(key: string, defaultPayload: T): T | null;
//   setToStorage: (key: string, value: object | null) => boolean;
//   clearFromStorage: () => boolean;
// }

// type BrowserStoreContext = {
//   local: Storage,
//   session: Storage
// };

const BrowserStorageContext = React.createContext({
  local: window.localStorage,
  session: window.sessionStorage,
})

const encrypt = (payload) => {
  const encPayload = aes
    .encrypt(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      `${ENC_KEY}`
    )
    .toString()
  return encPayload
}

function decrypt(payload) {
  let parsedDecryptedPayload = null

  if (payload) {
    const decryptedPayload = aes.decrypt(payload, `${ENC_KEY}`)
    const decryptedPayloadString = decryptedPayload.toString(encoding)

    if (decryptedPayloadString !== '') {
      try {
        parsedDecryptedPayload = JSON.parse(decryptedPayloadString)
      } catch (e) {
        const error = e
        if (error.name === 'SyntaxError') {
          parsedDecryptedPayload = decryptedPayloadString
        }
      }
    }
  }

  return parsedDecryptedPayload
}

export const useBrowserStorage = ({
  enableEncryption = false,
  storageType = 'local',
}) => {
  const browserstorage = useContext(BrowserStorageContext)

  if (browserstorage === null) {
    throw new Error('useBrowserStorage[Error]: Load provider before using hook')
  }

  const storageDriver = browserstorage[storageType]

  return {
    setToStorage: (key, value = null) => {
      /* @HINT: This is the side-effect for each state change cycle - we want to write to `localStorage` | `sessionStorage` */
      if (typeof storageDriver.setItem === 'function') {
        try {
          if (!enableEncryption) {
            if (value !== null) {
              if (typeof key === 'string') {
                storageDriver.setItem(
                  key,
                  typeof value === 'string' ? value : JSON.stringify(value)
                )
                return true
              }
            }
          } else {
            if (value !== null) {
              if (typeof key === 'string') {
                storageDriver.setItem(key, encrypt(value))
                return true
              }
            }
          }
        } catch (error) {
          const storageError = error
          if (storageError.name === 'QuotaExceededError') {
            return false
          }
        }
      }
      return false
    },
    clearFromStorage: (key = '') => {
      /* @HINT: As the component unmounts, we want to delete from `localStorage` | `sessionStorage` */
      if (typeof storageDriver.removeItem === 'function') {
        try {
          storageDriver.removeItem(key)
        } catch (_) {
          return false
        }
        return true
      }
      return false
    },
    getFromStorage(key, defaultPayload = {}) {
      /* @HINT: We want to fetch from `sessionStorage` */
      let stringifiedPayload = null

      try {
        if (typeof storageDriver.getItem === 'function') {
          stringifiedPayload = storageDriver.getItem(key)
        }
      } catch (error) {
        const storageError = error
        if (storageError.name === 'SecurityError') {
          stringifiedPayload = null
        }
      }

      if (!enableEncryption) {
        let payload = null
        try {
          payload = !stringifiedPayload
            ? defaultPayload
            : JSON.parse(stringifiedPayload)
        } catch (e) {
          const error = e
          payload = defaultPayload
          if (error.name === 'SyntaxError') {
            if (stringifiedPayload !== null) {
              payload = stringifiedPayload
            }
          }
        }
        return payload
      } else {
        const payload = decrypt(stringifiedPayload)
        return !payload ? defaultPayload : payload
      }
    },
  }
}

// basic stack data-structure definition
class Stack {
  constructor(data = []) {
    this.length = 0
    if (Array.isArray(data)) {
      this.push.apply(this, data)
    }
  }

  isEmpty() {
    return this.length === 0
  }

  size() {
    return this.length
  }

  peek() {
    return this[this.size() - 1]
  }

  push(...args) {
    return Array.prototype.push.apply(this, args)
  }

  pop() {
    return Array.prototype.pop.call(this)
  }

  replaceTop(...args) {
    this.pop()
    this.push(...args)
  }

  toJSON() {
    return '[ ' + Array.prototype.slice.call(this, 0).join(', ') + ' ]'
  }

  toObject() {
    try {
      return JSON.parse(this.toJSON())
    } catch (e) {
      if (e.name === 'SyntaxError') {
        return Array.prototype.slice.call(this, 0, this.size())
      }
      return []
    }
  }
}

/* @NOTE: algorithm implementation of {getNavDirection} */

const getNavDirection = (navStack, lastLoadedURL) => {
  /* @NOTE: Direction: back (-1), reload (0), fresh load (-9) and forward (1) */
  let direction = -9
  /* @HINT: The current URL on browser page */
  const docURL = document.location.href

  /* @HINT: The temporary "auxillary" stack object to aid page nav logic */
  let auxStack = new Stack()
  /* @HINT: Take note of the intial state of the navigation stack */
  const wasNavStackEmpty = navStack.isEmpty()

  // Firstly, we need to check that if the navStack isn't empty, then
  // we need to remove the last-loaded URL to a temporary stack so we
  // can compare the second-to-last URL in the stack with the current
  // document URL to determine the direction
  if (!wasNavStackEmpty) {
    auxStack.push(navStack.pop())
  } else {
    auxStack.push(docURL)
  }

  // Check top of the navigation stack (which is the second-to-last URL loaded)
  // if it's equal to the currentg document URL. If it is, then the navigation
  // direction is 'Back' (-1)
  if (docURL === navStack.peek()) {
    // Back (back button was clicked)
    direction = -1
  } else {
    // Check top of the temporary "auxillary" stack
    if (lastLoadedURL === auxStack.peek()) {
      // if the last-loaded URL is the
      // current one and then determine
      // the correct direction
      if (lastLoadedURL === docURL) {
        if (wasNavStackEmpty) {
          direction = -9 // Fresh Load
        } else {
          direction = 0 // Reload (refresh button was clicked)
        }
      } else {
        direction = 1 // Forward (forward button was clicked)
      }
    }
  }

  // If the direction is not 'Back' (i.e. back button clicked),
  // then replace the URL that was poped earlier and optionally
  // record the current document URL
  if (direction !== -1) {
    // if the temporary stack isn't empty
    // then empty it's content into the
    // top of the navigation stack
    if (!auxStack.isEmpty()) {
      navStack.push(auxStack.pop())
    }

    // push back the current document URL if and only if it's
    // not already at the top of the navigation stack
    if (docURL !== navStack.peek()) {
      navStack.push(docURL)
    }
  }

  // do away with the temporary stack (clean up action)
  // as it's now empty
  auxStack = null

  // return the direction of single-page app navigation
  return direction // Direction: back (-1), reload (0), fresh load (-9) and forward (1)
}

export const useBeforeUnload = ({ when, message }) => {
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = message
      return message
    }

    if (when) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [when, message])
}

/**!
 * `useUnsavedChangesLock()` ReactJS hook
 */

// type UserConfirmationCheck = ((status: boolean) => boolean | void) | null;

export const useUnsavedChangesLock = ({ useBrowserPrompt = false }) => {
  const [verifyConfimation, setVerifyConfirmation] = useState(false)
  const [verifyConfirmCallback, setVerifyConfirmCallback] = useState(null)

  const getUserConfirmation = (message, callback) => {
    if (useBrowserPrompt) {
      const allowTransition = window.confirm(message)
      window.setTimeout(() => {
        callback(allowTransition)
      }, 1000)
    } else {
      setVerifyConfirmCallback((status) => callback(status))
      setVerifyConfirmation(true)
    }
  }

  return {
    verifyConfimation,
    getUserConfirmation,
    allowTransition: () => {
      setVerifyConfirmation(false)
      if (verifyConfirmCallback !== null) {
        verifyConfirmCallback(true)
      }
    },
    blockTransition: () => {
      setVerifyConfirmation(true)
      if (verifyConfirmCallback !== null) {
        verifyConfirmCallback(false)
      }
    },
  }
}

/**!
 * `useRoutingMonitor()` ReactJS hook
 */

export const useRoutingMonitor = ({
  unsavedChangesRouteKeysMap = {
    '/': '__root_unsaved_items',
  },
  documentTitlePrefix = '',
  setupPageTitle = false,
  appPathnamePrefix = '/',
  getUserConfirmation,
  promptMessage = 'You have unsaved items on this page. Would you like to discard them ?',
  shouldBlockRoutingTo = () => false,
  onNavigation = () => undefined,
}) => {
  const startLocation = useLocation()
  const history = useHistory()
  const { setToStorage, getFromStorage, clearFromStorage } = useBrowserStorage({
    enableEncryption: false,
    storageType: 'session',
  })
  const [navigationList, setNavigationList] = useState([startLocation])

  const calculateNextNavigationList = (
    navigationList,
    navigationStackAction,
    location
  ) => {
    const navigationStack = new Stack(
      navigationList ? navigationList.slice(0) : []
    )

    switch (navigationStackAction) {
      case 'POP':
        navigationStack.pop()
        return navigationStack.toObject()
      case 'PUSH':
        navigationStack.push(location)
        return navigationStack.toObject()
      case 'REPLACE':
        navigationStack.replaceTop(location)
        return navigationStack.toObject()
      default:
        return navigationStack.toObject()
    }
  }

  const routeChangeProcessCallbackFactory = (
    unsavedChangesKey,
    location,
    unblock
  ) => {
    return (shouldDiscardUnsavedItems) => {
      if (shouldDiscardUnsavedItems) {
        setToStorage(unsavedChangesKey, 'saved')
        /* @HINT: There are parts of this React app that listen for this custom event ("discardunsaveditems") 
          and acts accordingly */
        /* @NOTE: Event "discardunsaveditems" is fired here so that items yet to saved are discarded and not saved */
        window.dispatchEvent(new Event('discardunsaveditems'))

        return shouldBlockRoutingTo(location.pathname) ? false : void unblock()
      } else {
        /* @HINT: Store signal for unsaved items on the Dashboard as pending */
        setToStorage(unsavedChangesKey, 'pending')
        return false
      }
    }
  }

  const onBeforeRouteChange = (location, unblock) => {
    const formerPathname = getFromStorage('$__former_url', '/')
    const unsavedChangesKey =
      unsavedChangesRouteKeysMap[
        formerPathname.replace(appPathnamePrefix, '/')
      ] || ''

    /* @HINT: Fetch signal for unsave items on the app by the user */
    const unsavedItemsStatus = getFromStorage(unsavedChangesKey, 'saved')
    /* @HINT: If the there are items to be "saved", then prompt the user with a dialog box message */
    if (unsavedItemsStatus !== 'saved') {
      return getUserConfirmation(
        promptMessage,
        routeChangeProcessCallbackFactory(unsavedChangesKey, location, unblock)
      )
    }
  }

  useEffect(() => {
    return () => {
      clearFromStorage('$__former_url')
    }
    /* eslint-disable */
  }, [])

  useEffect(() => {
    /* @HINT: */
    const unblock = history.block((location) => {
      return onBeforeRouteChange(location, unblock)
    })

    /* @HINT: */
    const unlisten = history.listen(function onRouteChange(location, action) {
      /* @HINT: The last loaded page URL is stored in session storage and retrieved upon the next page route change */
      const formerPathname = getFromStorage(
        '$__former_url',
        startLocation.pathname
      )
      /* @HINT: Get the former URL */
      const lastloadedURL = `${document.location.origin}${formerPathname}`
      /* @HINT: The document <title> of the page is programatically created from the page URL pathname */
      const title = location.pathname
        .replace(/^\//, '')
        .split('/')
        .slice(0)
        .reduce((buffer, suffix) => {
          const capitalizedSuffix =
            suffix.charAt(0).toUpperCase() + suffix.substring(1)
          return (
            buffer +
            (buffer !== '' ? ' ' + capitalizedSuffix : capitalizedSuffix)
          )
        }, '')

      /* @HINT: The document <title> assigned with an additional prefix */
      if (setupPageTitle) {
        document.title =
          Boolean(documentTitlePrefix) &&
          typeof documentTitlePrefix === 'string'
            ? documentTitlePrefix + (title || 'Home')
            : title || 'Home'
      } else {
        if (
          Boolean(documentTitlePrefix) &&
          typeof documentTitlePrefix === 'string'
        ) {
          document.title = documentTitlePrefix + document.title
        }
      }

      const navigationDirection = getNavDirection(
        new Stack(
          navigationList.map(
            (navigationListItem) =>
              `${document.location.origin}${navigationListItem.pathname}`
          )
        ),
        lastloadedURL
      )

      /* @HINT: Update the last loaded URL so it is consistent with the next page route change */
      setToStorage('$__former_url', location.pathname)

      setNavigationList((prevNavList) => {
        return calculateNextNavigationList(prevNavList, action, location)
      })

      return onNavigation(history, {
        documentTitle: document.title,
        currentPathname: location.pathname,
        previousPathname: formerPathname,
        navigationDirection,
      })
    })

    return () => {
      /* @HINT: If there is a listener set for the "beforeunload" event */
      if (typeof unblock === 'function') {
        /* @HINT: Then, at this point, assume all unsaved items are saved  
          and then remove the listener for "beforeunload" event */
        for (const unsavedChangesKey in unsavedChangesRouteKeysMap) {
          if (unsavedChangesRouteKeysMap.hasOwnProperty(unsavedChangesKey)) {
            setToStorage(unsavedChangesKey, 'saved')
          }
        }
        unblock()
      }
      unlisten()
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [history])

  return {
    navigationList,
    getBreadCrumbsList(pathname = '/') {
      let prependRootPathname = null
      const fullNavigationList = navigationList.slice(0).reverse()
      const breadcrumbsList = []
      /* @HINT: instead of using .split(), we use .match() */
      const [
        firstPathnameFragment,
        ...remainingPathnameFragments
      ] = pathname.match(/(?:^\/)?[^/]+/g)
      const fragmentsLength = remainingPathnameFragments.length + 1
      const currentPagePathname = pathname.startsWith(appPathnamePrefix)
        ? firstPathnameFragment
        : `${
            appPathnamePrefix.startsWith('/')
              ? appPathnamePrefix
              : '/' + appPathnamePrefix
          }${
            appPathnamePrefix.endsWith('/')
              ? firstPathnameFragment.replace(/^\//, '')
              : firstPathnameFragment.replace(/^([^/])/, '/$1')
          }`

      for (let count = 0; count < fullNavigationList.length; count++) {
        const navListItem = fullNavigationList[count]
        const navListItemPathnameFragmentsLength =
          navListItem.pathname.split('/').length - 1
        if (navListItem.pathname.includes(currentPagePathname)) {
          if (
            !breadcrumbsList
              .map((breadcrumbsListItem) => breadcrumbsListItem.pathname)
              .includes(navListItem.pathname)
          ) {
            if (navListItemPathnameFragmentsLength <= fragmentsLength) {
              breadcrumbsList.push(navListItem)
            }
          }
        } else {
          if (navListItem.pathname === '/') {
            prependRootPathname = navListItem
          }
          break
        }
      }

      if (prependRootPathname !== null) {
        breadcrumbsList.push(prependRootPathname)
      }

      return breadcrumbsList.reverse()
    },
  }
}
