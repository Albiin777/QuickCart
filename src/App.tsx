function App() {
  return (
<div //main container 
  className="min-h-screen bg-gray-200"  > 
  <div //header
  className="px-4 py-4 text-white text-2xl font-medium tracking-tight text-center"
  style={{ backgroundColor: "#24344E" }}
  >
  Grocery Tracker
  </div>

<div className="p-4 bg-[#cbd1d8] flex items-center gap-3">
  <input
    type="text"
    placeholder="Search items..."
    className="flex-1 p-3 rounded-lg bg-[#22324a]
         text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#24344E]"
  />
  <div className="relative group" //new list button container
  >
    <button //new list button 
      className="w-12 h-12 text-white rounded-lg flex items-center justify-center text-xl hover:opacity-90"
      style={{ backgroundColor: "#22324a" }}
    >  ➕
    </button>
    <div className="absolute right-0 mt-2 px-3 py-1 text-sm bg-[#cbd1d8] text-white rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
      New list
    </div>
  </div>
</div>

<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#dfe3e8]">
<div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm">
  
  <div className="flex items-center gap-4">
    <input 
      type="checkbox" 
      className="w-6 h-6 accent-[#24344E]"
    />

    <span className="text-lg">
      Milk
    </span>
  </div>

  <div className="text-sm text-gray-500">
    Last: 2 days ago
  </div>

</div>

 
</div>

</div>
  )
}

export default App
