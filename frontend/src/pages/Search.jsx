import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Search as SearchIcon, Star, Filter, UserCircle, MapPin, CheckCircle
} from 'lucide-react';

// Using the same category list structure (we could decouple this to a constants file, but for speed we redefine here or export from Home. Alternatively, I will just list names)
const CATEGORIES = [
  'Plumber', 'Electrician', 'Web Developer', 'Civil Engineer', 'Painter',
  'Barber & Salon', 'Moving & Delivery', 'Tutor', 'Photographer', 'Catering & Chef',
  'Healthcare', 'Home Renovation', 'Gardening', 'IT Support', 'Security',
  'Interior Design', 'Auto Mechanic', 'Babysitter', 'Personal Trainer', 'Graphic Designer',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';

  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('highest_rated'); // highest_rated, lowest_price, newest

  useEffect(() => {
    // If URL params change via back button or typed URL, update local state
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    // We can fetch all and filter in frontend quickly, or use proper backend queries. 
    // Since backend getAllWorkers supports ?category, we will use it for category filtering if it's not 'All'
    const endpoint = selectedCategory === 'All' 
       ? '/api/workers' 
       : `/api/workers?category=${encodeURIComponent(selectedCategory)}`;

    api.get(endpoint)
      .then(data => {
        setWorkers(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error(err);
        setWorkers([]);
      })
      .finally(() => setIsLoading(false));
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ category: selectedCategory === 'All' ? '' : selectedCategory, q: searchQuery });
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSearchParams({ category: cat === 'All' ? '' : cat, q: searchQuery });
  };

  // Filter by query and sort logic
  const displayedWorkers = workers.filter(w => {
    if (!searchQuery) return true;
    const nameMatch = w.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const skillMatch = w.skills?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || skillMatch;
  }).sort((a, b) => {
    if (sortBy === 'highest_rated') {
      return (b.ratingAverage || 0) - (a.ratingAverage || 0);
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    // Simplistic text sorting for price as a fallback if real numbers aren't strict.
    // Assuming price format strings like "$50/hr". Best effort sort based on integer extracted.
    if (sortBy === 'lowest_price') {
       const getPriceInt = (p) => parseInt((p||'0').replace(/\D/g, ''), 10);
       return getPriceInt(a.pricing) - getPriceInt(b.pricing);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/4 space-y-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" /> Filters
          </h3>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <button 
              onClick={() => handleCategorySelect('All')}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${selectedCategory === 'All' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${selectedCategory === cat ? 'bg-primary-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search & Sort Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-slate-500">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="highest_rated">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="lowest_price">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse"></div>)
          ) : displayedWorkers.length > 0 ? (
            displayedWorkers.map(worker => (
              <div key={worker.userId} className="flex flex-col p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400">
                      <UserCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {worker.user?.name || 'Unknown Pro'}
                        <CheckCircle className="w-4 h-4 text-primary-500" />
                      </h3>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{worker.serviceCategory}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-xl font-bold text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    {worker.ratingAverage > 0 ? worker.ratingAverage.toFixed(1) : 'New'}
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {worker.skills || "This professional hasn't added a description yet."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300">
                      💰 {worker.pricing || 'Rate not set'}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5" /> {worker.serviceArea || 'Anywhere'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Link to={'/worker/' + worker.workerId} className="w-full inline-block text-center py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:bg-primary-600 hover:text-white transition-colors">
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
              <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No professionals found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or searching for something else.</p>
              <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="mt-6 px-6 py-2 bg-primary-50 text-primary-600 rounded-xl font-medium hover:bg-primary-100 transition">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
