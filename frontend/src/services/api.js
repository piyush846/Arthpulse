// api.js
// All FastAPI calls live here — one place, easy to update.
// If backend URL changes, you change it here only — not in 10 components.

import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

export const getDashboard  = ()              => api.get('/api/dashboard')
export const getNews       = (limit, skip, q) => api.get('/api/news', { params: { limit, skip, q } })
export const getTickers    = ()              => api.get('/api/tickers')
export const getNewsByTicker = (ticker)      => api.get(`/api/ticker/${ticker}`)
export const triggerFetch  = ()              => api.get('/api/fetch')
export const getTickerInfo = (ticker) => api.get(`/api/ticker/${ticker}/info`)
export const getTickerHistory =(ticker)=> api.get(`/api/ticker/${ticker}/history`)
export const getTickerPrices = (ticker) => api.get(`/api/ticker/${ticker}/prices`)
export const getSectors  = () => api.get('/api/dashboard/sectors')
export const getTrending = () => api.get('/api/dashboard/trending')
export const getMovers   = () => api.get('/api/dashboard/movers')
export const getNarrative = () => api.get('/api/dashboard/narrative')
export const getMarketBreadth    = ()       => api.get('/api/market/breadth')
export const getSentimentTimeline = (period) => api.get('/api/dashboard/timeline', { params: { period } })
export const getTickerCorrelation = (ticker) => api.get(`/api/ticker/${ticker}/correlation`)
export const getIndiaBreadth   = ()       => api.get('/api/india/breadth')
export const getIndiaTickers   = ()       => api.get('/api/india/tickers')
export const getIndiaNews      = (limit, skip, q) => api.get('/api/india/news', { params: { limit, skip, q } })
export const getIndiaMovers    = ()       => api.get('/api/india/movers')
export const getIndiaNarrative = ()       => api.get('/api/india/narrative')