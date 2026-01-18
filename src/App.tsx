import { useState, useEffect, useRef, useCallback } from "react"
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
} from "./firebase"
import type { User } from "./firebase"

function formatDate(date: Date) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = String(d.getFullYear()).slice(-2)
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")

  return `${month}/${year} ${hours}:${minutes}`
}

interface CartItem {
  id: number
  name: string
  checked: boolean
  lastBought: Date | null
  sourceListId?: number
}

interface CartList {
  id: number
  name: string
  lastEdited: Date
  items: CartItem[]
  isToBuyList?: boolean
}

const TO_BUY_LIST_ID = -1

const serializeLists = (lists: CartList[]) => {
  return lists.map(list => ({
    ...list,
    lastEdited: list.lastEdited.toISOString(),
    items: list.items.map(item => ({
      ...item,
      lastBought: item.lastBought ? item.lastBought.toISOString() : null
    }))
  }))
}

const deserializeLists = (lists: any[]): CartList[] => {
  return lists.map(list => ({
    ...list,
    lastEdited: new Date(list.lastEdited),
    items: list.items.map((item: any) => ({
      ...item,
      lastBought: item.lastBought ? new Date(item.lastBought) : null
    }))
  }))
}

// ========== AUTH MODAL COMPONENT ==========
interface AuthModalProps {
  isSignUp: boolean
  setIsSignUp: (v: boolean) => void
  authEmail: string
  setAuthEmail: (v: string) => void
  authPassword: string
  setAuthPassword: (v: string) => void
  authError: string
  setAuthError: (v: string) => void
  authProcessing: boolean
  handleSignIn: () => Promise<void>
  handleSignUp: () => Promise<void>
  setShowAuthModal: (v: boolean) => void
}

function AuthModal({
  isSignUp,
  setIsSignUp,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  authProcessing,
  handleSignIn,
  handleSignUp,
  setShowAuthModal
}: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async () => {
    if (isSignUp) {
      await handleSignUp()
    } else {
      await handleSignIn()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && authEmail && authPassword) {
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>
          <button
            onClick={() => {
              setShowAuthModal(false)
              setAuthError("")
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {authError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 
                         focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 
                           focus:border-blue-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-gray-500 hover:text-gray-700 p-1"
              >
                {showPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                    />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                    />
                  </svg>
                )}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={authProcessing || !authEmail || !authPassword}
            className="w-full py-3 px-4 rounded-xl font-bold text-lg
                       bg-gradient-to-r from-[#1a237e] to-[#3949ab]
                       text-white shadow-lg
                       transform transition hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <p className="text-center text-sm text-gray-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setAuthError("")
              }}
              className="text-blue-600 font-medium hover:underline"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ========== MOBILE MENU COMPONENT ==========
interface MobileMenuProps {
  user: User | null
  setShowMobileMenu: (v: boolean) => void
  setShowAuthModal: (v: boolean) => void
  handleSignOut: () => Promise<void>
}

function MobileMenu({ user, setShowMobileMenu, setShowAuthModal, handleSignOut }: MobileMenuProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileMenu(false)}>
      <div 
        className="absolute right-0 top-0 w-64 bg-white shadow-xl rounded-bl-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-[#111636] to-[#31324E] text-white rounded-bl-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-lg">Menu</span>
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="text-2xl hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          {user && (
            <div className="text-sm">
              <p className="text-gray-300">Signed in as</p>
              <p className="truncate font-medium">{user.email}</p>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {user ? (
            showSignOutConfirm ? (
              <div className="space-y-3">
                <p className="text-center text-gray-700 font-medium">Are you sure you want to sign out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleSignOut()
                      setShowMobileMenu(false)
                    }}
                    className="flex-1 py-2 px-4 rounded-xl font-medium
                               bg-red-500 text-white
                               hover:bg-red-600 transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-2 px-4 rounded-xl font-medium
                               bg-gray-200 text-gray-700
                               hover:bg-gray-300 transition"
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full py-3 px-4 rounded-xl font-medium
                           bg-red-500 text-white
                           hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            )
          ) : (
            <button
              onClick={() => {
                setShowMobileMenu(false)
                setShowAuthModal(true)
              }}
              className="w-full py-3 px-4 rounded-xl font-medium
                         bg-gradient-to-r from-[#1a237e] to-[#3949ab]
                         text-white transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ========== MAIN APP COMPONENT ==========
function App() {
  const [lists, setLists] = useState<CartList[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [activeListId, setActiveListId] = useState<number | null>(null)
  const [editingListName, setEditingListName] = useState(false)
  const [tempListName, setTempListName] = useState("")
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [tempItemName, setTempItemName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Auth states
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [authProcessing, setAuthProcessing] = useState(false)
  const [useWithoutSignIn, setUseWithoutSignIn] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Track if Firestore data has been loaded once
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeList = lists.find(l => l.id === activeListId)

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      if (currentUser) {
        setShowWelcome(false)
        setUseWithoutSignIn(false)
      } else {
        setInitialLoadDone(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // Load Firestore data once when user logs in
  useEffect(() => {
    if (!user || initialLoadDone) return

    const loadData = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(userDocRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data() as { lists?: any[] }
          if (data && data.lists) {
            setLists(deserializeLists(data.lists))
          }
        }
        setInitialLoadDone(true)
      } catch (error) {
        console.error("Error loading data:", error)
        setInitialLoadDone(true)
      }
    }

    loadData()
  }, [user, initialLoadDone])

  // Save to Firestore
  const saveToFirestore = useCallback(async (listsToSave: CartList[]) => {
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(userDocRef, {
        lists: serializeLists(listsToSave),
        lastUpdated: new Date().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error("Error saving to Firestore:", error)
    }
  }, [user])

  // Debounced save when lists change
  useEffect(() => {
    if (!user || !initialLoadDone) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToFirestore(lists)
    }, 1500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [lists, user, initialLoadDone, saveToFirestore])

  // Load from localStorage for non-signed-in users
  useEffect(() => {
    if (useWithoutSignIn && !user) {
      const savedLists = localStorage.getItem("quickcart_lists")
      if (savedLists) {
        try {
          setLists(deserializeLists(JSON.parse(savedLists)))
        } catch (e) {
          console.error("Error loading from localStorage:", e)
        }
      }
    }
  }, [useWithoutSignIn, user])

  // Save to localStorage for non-signed-in users
  useEffect(() => {
    if (useWithoutSignIn && !user && lists.length > 0) {
      localStorage.setItem("quickcart_lists", JSON.stringify(serializeLists(lists)))
    }
  }, [lists, useWithoutSignIn, user])

  // Auth handlers
  const handleSignIn = useCallback(async () => {
    setAuthError("")
    setAuthProcessing(true)
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword)
      setShowAuthModal(false)
      setAuthEmail("")
      setAuthPassword("")
    } catch (error: any) {
      setAuthError(error.message.replace("Firebase: ", ""))
    }
    setAuthProcessing(false)
  }, [authEmail, authPassword])

  const handleSignUp = useCallback(async () => {
    setAuthError("")
    setAuthProcessing(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: authEmail,
        lists: [],
        createdAt: new Date().toISOString()
      })
      setShowAuthModal(false)
      setAuthEmail("")
      setAuthPassword("")
    } catch (error: any) {
      setAuthError(error.message.replace("Firebase: ", ""))
    }
    setAuthProcessing(false)
  }, [authEmail, authPassword])

  const handleSignOut = useCallback(async () => {
    try {
      if (lists.length > 0) {
        await saveToFirestore(lists)
      }
      await signOut(auth)
      setLists([])
      setShowWelcome(true)
      setShowMobileMenu(false)
      setShowSignOutConfirm(false)
      setInitialLoadDone(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [lists, saveToFirestore])

  // List name handlers
  const startEditingListName = () => {
    if (activeList) {
      setTempListName(activeList.name)
      setEditingListName(true)
    }
  }

  const saveListName = () => {
    if (activeList) {
      const newName = tempListName.trim() || "Untitled List"
      setLists(prev => prev.map(list => 
        list.id === activeListId 
          ? { ...list, name: newName, lastEdited: new Date() }
          : list
      ))
    }
    setEditingListName(false)
  }

  // Item name handlers
  const startEditingItemName = (item: CartItem) => {
    setTempItemName(item.name)
    setEditingItemId(item.id)
  }

  const saveItemName = (itemId: number) => {
    setLists(prev => prev.map(list => 
      list.id === activeListId 
        ? { 
            ...list, 
            lastEdited: new Date(),
            items: list.items.map(item => 
              item.id === itemId 
                ? { ...item, name: tempItemName }
                : item
            )
          }
        : list
    ))
    setEditingItemId(null)
  }

  const addItem = () => {
    const newItemId = Date.now()
    setLists(prev => prev.map(list => 
      list.id === activeListId 
        ? { 
            ...list, 
            lastEdited: new Date(),
            items: [...list.items, {
              id: newItemId,
              name: "",
              checked: false,
              lastBought: null
            }]
          }
        : list
    ))
    setTempItemName("")
    setEditingItemId(newItemId)
  }

  const toggleItem = (itemId: number) => {
    setLists(prev => prev.map(list => 
      list.id === activeListId 
        ? { 
            ...list, 
            lastEdited: new Date(),
            items: list.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    checked: !item.checked,
                    lastBought: !item.checked ? new Date() : item.lastBought
                  }
                : item
            )
          }
        : list
    ))
  }

  const deleteItem = (itemId: number) => {
    setLists(prev => prev.map(list => 
      list.id === activeListId 
        ? { 
            ...list, 
            lastEdited: new Date(),
            items: list.items.filter(item => item.id !== itemId)
          }
        : list
    ))
  }

  const addToToBuyList = () => {
    if (!activeList || activeList.id === TO_BUY_LIST_ID) return

    const uncheckedItems = activeList.items
      .filter(item => !item.checked && item.name.trim() !== "")
      .map(item => ({
        ...item,
        id: Date.now() + Math.random(),
        sourceListId: activeList.id,
        checked: false
      }))

    if (uncheckedItems.length === 0) return

    setLists(prev => {
      const existingToBuyList = prev.find(l => l.id === TO_BUY_LIST_ID)
      
      if (existingToBuyList) {
        const existingNames = new Set(existingToBuyList.items.map(i => i.name.toLowerCase()))
        const newItems = uncheckedItems.filter(item => !existingNames.has(item.name.toLowerCase()))
        
        return prev.map(list => 
          list.id === TO_BUY_LIST_ID 
            ? { 
                ...list, 
                lastEdited: new Date(),
                items: [...list.items, ...newItems]
              }
            : list
        )
      } else {
        const toBuyList: CartList = {
          id: TO_BUY_LIST_ID,
          name: "To Buy",
          lastEdited: new Date(),
          items: uncheckedItems,
          isToBuyList: true
        }
        return [toBuyList, ...prev]
      }
    })
  }

  const getSourceListName = (sourceListId?: number) => {
    if (!sourceListId) return null
    const sourceList = lists.find(l => l.id === sourceListId)
    return sourceList?.name || null
  }

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#cbd1d8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#111636] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading QuickCart...</p>
        </div>
      </div>
    )
  }

  // Welcome screen
  if (showWelcome && !user && !useWithoutSignIn) {
    return (
      <div className="min-h-screen bg-[#cbd1d8] flex flex-col">
        <div className="px-4 py-4 text-white text-2xl font-medium tracking-tight
                        bg-gradient-to-r from-[#111636] to-[#31324E]/70
                        bg-opacity-80 backdrop-blur-lg border-b border-white/10
                        shadow-md flex items-center justify-center gap-3">
          <img src="\new-cart-white.png" alt="icon" className="w-10 h-10" />
          QuickCart
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to QuickCart</h1>
            <p className="text-gray-600 mb-6">
              Create and manage your shopping lists easily. Sign in to sync across devices or use without an account.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAuthModal(true)
                  setIsSignUp(false)
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-lg
                           bg-gradient-to-r from-[#1a237e] to-[#3949ab]
                           text-white shadow-lg
                           transform transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(true)
                  setIsSignUp(true)
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-lg
                           bg-gradient-to-r from-[#111636]/80 to-[#31324E]/60
                           text-white shadow-lg
                           transform transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Account
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              <button
                onClick={() => {
                  setUseWithoutSignIn(true)
                  setShowWelcome(false)
                }}
                className="w-full py-3 px-4 rounded-xl font-medium text-lg
                           bg-gray-100 text-gray-700
                           border-2 border-gray-200
                           transform transition hover:bg-gray-200 active:scale-[0.98]"
              >
                Use Without Sign In
              </button>

              <p className="text-xs text-gray-500 mt-4">
                ⚠️ Without signing in, your data will only be saved on this device and browser.
              </p>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            setAuthError={setAuthError}
            authProcessing={authProcessing}
            handleSignIn={handleSignIn}
            handleSignUp={handleSignUp}
            setShowAuthModal={setShowAuthModal}
          />
        )}
      </div>
    )
  }

  // --- VIEW 1: SINGLE LIST PAGE ---
  if (activeListId !== null && activeList) {
    const filteredItems = activeList.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const uncheckedItems = filteredItems.filter(item => !item.checked)
    const checkedItems = filteredItems.filter(item => item.checked)
    const hasCheckedItems = checkedItems.length > 0
    const hasUncheckedItems = uncheckedItems.length > 0

    const isToBuyList = activeList.id === TO_BUY_LIST_ID

    return (
      <div className="min-h-screen bg-[#cbd1d8] flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 text-white
                        bg-gradient-to-r from-[#111636] to-[#31324E]/70
                        bg-opacity-80 backdrop-blur-lg border-b border-white/10
                        shadow-md flex items-center gap-3">
          <button 
            onClick={() => {
              if (editingListName) saveListName()
              if (editingItemId) saveItemName(editingItemId)
              setActiveListId(null)
              setSearchQuery("")
            }}
            className="text-3xl text-white hover:text-gray-300"
          >
            ←
          </button>
          
          {isToBuyList ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl font-medium tracking-tight">🛒 To Buy</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {uncheckedItems.length} items
              </span>
            </div>
          ) : editingListName ? (
            <input
              type="text"
              value={tempListName}
              onChange={(e) => setTempListName(e.target.value)}
              onBlur={saveListName}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
                if (e.key === 'Escape') {
                  setTempListName(activeList.name)
                  setEditingListName(false)
                }
              }}
              autoFocus
              className="bg-transparent border-b-2 border-white text-xl font-medium 
                         outline-none flex-1 px-2 py-1 text-white"
            />
          ) : (
            <span 
              onClick={startEditingListName}
              className="text-xl font-medium tracking-tight cursor-pointer 
                         hover:text-gray-200 flex-1"
            >
              {activeList.name || "Untitled List"}
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-[#111636]/30 text-white">
            <svg 
              className="w-5 h-5 text-gray-300 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items"
              className="bg-transparent outline-none flex-1 text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
          {/* Unchecked Items */}
          {uncheckedItems.map(item => (
            <div 
              key={item.id}
              className="flex items-center gap-3 p-4 rounded-xl
                         bg-gradient-to-r from-[#111636]/80 to-[#31324E]/60
                         text-white shadow-lg"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="w-6 h-6 rounded accent-green-500 cursor-pointer flex-shrink-0"
              />

              <div className="flex-1 flex flex-col min-w-0">
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={tempItemName}
                    onChange={(e) => setTempItemName(e.target.value)}
                    onBlur={() => saveItemName(item.id)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                      if (e.key === 'Escape') {
                        setTempItemName(item.name)
                        setEditingItemId(null)
                      }
                    }}
                    autoFocus
                    placeholder="Item name"
                    className="bg-transparent outline-none border-b border-white/50 text-lg font-medium text-white"
                  />
                ) : (
                  <span
                    onClick={() => startEditingItemName(item)}
                    className="text-lg font-medium cursor-pointer truncate text-white"
                  >
                    {item.name || "Unnamed item"}
                  </span>
                )}
                {isToBuyList && item.sourceListId && (
                  <span className="text-xs text-blue-300">
                    From: {getSourceListName(item.sourceListId)}
                  </span>
                )}
                {item.lastBought && (
                  <span className="text-xs text-gray-400">
                    Last bought: {formatDate(item.lastBought)}
                  </span>
                )}
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                           text-white hover:bg-red-600 active:scale-95 text-lg"
              >
                🗑
              </button>
            </div>
          ))}

          {/* Divider */}
          {hasUncheckedItems && hasCheckedItems && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-500/50"></div>
              <span className="text-sm text-gray-500 font-medium">Completed</span>
              <div className="flex-1 h-px bg-gray-500/50"></div>
            </div>
          )}

          {/* Checked Items */}
          {checkedItems.map(item => (
            <div 
              key={item.id}
              className="flex items-center gap-3 p-4 rounded-xl
                         bg-gradient-to-r from-[#111636]/50 to-[#31324E]/40
                         text-white shadow-lg opacity-70"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                className="w-6 h-6 rounded accent-green-500 cursor-pointer flex-shrink-0"
              />

              <div className="flex-1 flex flex-col min-w-0">
                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={tempItemName}
                    onChange={(e) => setTempItemName(e.target.value)}
                    onBlur={() => saveItemName(item.id)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                      if (e.key === 'Escape') {
                        setTempItemName(item.name)
                        setEditingItemId(null)
                      }
                    }}
                    autoFocus
                    placeholder="Item name"
                    className="bg-transparent outline-none border-b border-white/50 text-lg font-medium line-through text-gray-400"
                  />
                ) : (
                  <span
                    onClick={() => startEditingItemName(item)}
                    className="text-lg font-medium cursor-pointer truncate line-through text-gray-400"
                  >
                    {item.name || "Unnamed item"}
                  </span>
                )}
                {isToBuyList && item.sourceListId && (
                  <span className="text-xs text-blue-300/70">
                    From: {getSourceListName(item.sourceListId)}
                  </span>
                )}
                {item.lastBought && (
                  <span className="text-xs text-gray-400">
                    Last bought: {formatDate(item.lastBought)}
                  </span>
                )}
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                           text-white hover:bg-red-600 active:scale-95 text-lg"
              >
                🗑
              </button>
            </div>
          ))}

          {/* Add New Item Button */}
          <div
            onClick={addItem}
            className="flex items-center justify-center gap-3 p-4 rounded-xl cursor-pointer
                       bg-gradient-to-r from-[#111636]/80 to-[#31324E]/60
                       text-white shadow-lg
                       transform transition
                       hover:-translate-y-1 hover:shadow-lg
                       active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-2xl font-bold">
              +
            </div>
            <span className="text-lg font-bold">Add Item</span>
          </div>
        </div>

        {/* Add to To Buy Button */}
        {!isToBuyList && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#b8bfc7] border-t border-gray-400/30 shadow-lg">
            <button
              onClick={addToToBuyList}
              className="w-full py-4 rounded-xl font-bold text-lg
                         bg-gradient-to-r from-[#1a237e] to-[#3949ab]
                         text-white shadow-lg
                         transform transition
                         hover:from-[#1a237e] hover:to-[#5c6bc0]
                         active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <span>🛒</span>
              <span>Add to "To Buy" List</span>
            </button>
          </div>
        )}

        {showAuthModal && (
          <AuthModal
            isSignUp={isSignUp}
            setIsSignUp={setIsSignUp}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            setAuthError={setAuthError}
            authProcessing={authProcessing}
            handleSignIn={handleSignIn}
            handleSignUp={handleSignUp}
            setShowAuthModal={setShowAuthModal}
          />
        )}
        {showMobileMenu && (
          <MobileMenu
            user={user}
            setShowMobileMenu={setShowMobileMenu}
            setShowAuthModal={setShowAuthModal}
            handleSignOut={handleSignOut}
          />
        )}
      </div>
    )
  }

  // --- VIEW 2: DASHBOARD ---
  const sortedLists = [...lists].sort((a, b) => {
    if (a.id === TO_BUY_LIST_ID) return -1
    if (b.id === TO_BUY_LIST_ID) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-[#cbd1d8]">
      {/* Header */}
      <div className="px-4 py-4 text-white text-2xl font-medium tracking-tight
                      bg-gradient-to-r from-[#111636] to-[#31324E]/70
                      bg-opacity-80 backdrop-blur-lg border-b border-white/10
                      shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="new-cart-white.png" alt="icon" className="w-10 h-10" />
          <span>QuickCart</span>
        </div>
        
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            showSignOutConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">Sign out?</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-3 py-1 bg-gray-500 rounded hover:bg-gray-600 text-sm font-medium"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-300">Signed in as</span>
                  <span className="text-sm truncate max-w-[200px]">{user.email}</span>
                </div>
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 
                             text-sm font-medium transition"
                >
                  Sign Out
                </button>
              </>
            )
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 
                         text-sm font-medium transition"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className="w-6 h-0.5 bg-white rounded"></span>
          <span className="w-6 h-0.5 bg-white rounded"></span>
          <span className="w-6 h-0.5 bg-white rounded"></span>
        </button>
      </div>

      {/* Sync Status Banner */}
      {useWithoutSignIn && !user && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-800 text-sm">
            ⚠️ Data saved locally only
          </span>
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-amber-800 text-sm font-medium underline"
          >
            Sign in to sync
          </button>
        </div>
      )}

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#cbd1d8] flex flex-col items-center justify-start">
        {sortedLists.map(list => {
          const isToBuyList = list.id === TO_BUY_LIST_ID
          const uncheckedCount = list.items.filter(i => !i.checked).length
          
          return (
            <div
              key={list.id}
              className={`flex items-center justify-between gap-4 p-4 rounded-xl
                         text-white shadow-lg w-full cursor-pointer
                         ${isToBuyList 
                           ? 'bg-gradient-to-r from-[#1a237e] to-[#3949ab] ring-2 ring-blue-400/50' 
                           : 'bg-gradient-to-r from-[#111636]/80 to-[#31324E]/60'
                         }`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return
                setActiveListId(list.id)
              }}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {isToBuyList && <span>🛒</span>}
                  <span className="text-lg font-medium">{list.name || "Untitled List"}</span>
                  {isToBuyList && uncheckedCount > 0 && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {uncheckedCount}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-300">
                  Last edited: {formatDate(list.lastEdited)}
                </span>
              </div>

              {deleteConfirm === list.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Delete forever?</span>
                  <button
                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLists(prev => prev.filter(l => l.id !== list.id))
                      setDeleteConfirm(null)
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-500 rounded hover:bg-gray-600 text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(null)
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  className="w-9 h-9 rounded-lg flex items-center justify-center
                             text-white hover:bg-red-600 active:scale-95"
                  onClick={() => setDeleteConfirm(list.id)}
                >
                  🗑
                </button>
              )}
            </div>
          )
        })}

        {/* New List Card */}
        <div
          className="flex items-center justify-center gap-4 p-4 rounded-xl cursor-pointer w-full
                     bg-gradient-to-r from-[#111636]/80 to-[#31324E]/60
                     text-white
                     transform transition
                     hover:-translate-y-1 hover:shadow-lg
                     active:scale-95
                     shadow-lg shadow-black/20"
          onClick={() => {
            const newId = Date.now()
            setLists(prev => [
              ...prev,
              {
                id: newId,
                name: "New Cart List",
                lastEdited: new Date(),
                items: []
              }
            ])
            setActiveListId(newId)
          }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl leading-none font-bold">
            +
          </div>
          <div className="text-lg font-bold tracking-wide">
            New list
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authError={authError}
          setAuthError={setAuthError}
          authProcessing={authProcessing}
          handleSignIn={handleSignIn}
          handleSignUp={handleSignUp}
          setShowAuthModal={setShowAuthModal}
        />
      )}
      {showMobileMenu && (
        <MobileMenu
          user={user}
          setShowMobileMenu={setShowMobileMenu}
          setShowAuthModal={setShowAuthModal}
          handleSignOut={handleSignOut}
        />
      )}
    </div>
  )
}

export default App