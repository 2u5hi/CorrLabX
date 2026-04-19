const express      = require('express')
const cors         = require('cors')
const { execFile } = require('child_process')
const rateLimit    = require('express-rate-limit')
require('dotenv').config({ path: '../.env' })

const app      = express()
const PORT     = process.env.PORT || 3001
const API_KEY  = process.env.ALPHA_VANTAGE_KEY
const ORIGIN   = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: ORIGIN }))

const analyzeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Too many requests. Wait a moment and try again.' }
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.get('/analyze/:ticker', analyzeLimiter, (req, res) => {
    const ticker = req.params.ticker.toUpperCase()

    if (!/^[A-Z0-9.\-]{1,10}$/.test(ticker)) {
        return res.status(400).json({ error: 'Invalid ticker' })
    }

    execFile('py', ['../research/inefficiency_score.py', ticker], {
        timeout: 120000,
        env: { ...process.env, ALPHA_VANTAGE_KEY: API_KEY }
    }, (error, stdout) => {
        if (error) {
            return res.status(500).json({ error: 'Analysis failed — try again in a moment' })
        }
        try {
            const result = JSON.parse(stdout)
            if (result.error) {
                if (result.error.includes('No data returned')) {
                    return res.status(404).json({
                        error: `No data found for ${ticker}. Check the ticker symbol.`
                    })
                }
                if (result.error.includes('premium') || result.error.includes('rate')) {
                    return res.status(429).json({
                        error: 'API rate limit hit. Wait 60 seconds and try again.'
                    })
                }
                return res.status(500).json({ error: result.error })
            }
            res.json(result)
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse result' })
        }
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
