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