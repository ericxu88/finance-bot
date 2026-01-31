# Speed Optimization Guide

## Why Was It 84 Seconds?

The test was likely slow because:
1. **Intent parsing** was using the real API (~3-8s)
2. **Standard multi-agent mode** instead of fast mode (5 calls = ~20-40s)
3. **Slow model** (e.g., `gemini-1.5-pro` instead of `gemini-2.0-flash-lite`)

## Optimizations Applied

The test now:
- ✅ **Skips intent parsing** (uses `parsedAction` directly)
- ✅ **Uses fast mode** (unified agent = 1 call instead of 5)
- ✅ **Shows model being used** so you can verify

## Expected Speed

| Configuration | Expected Time |
|---------------|---------------|
| Fast mode + skip parsing + `gemini-2.0-flash-lite` | **3-8 seconds** |
| Fast mode + skip parsing + `gemini-2.0-flash` | **5-12 seconds** |
| Fast mode + intent parsing + `gemini-2.0-flash-lite` | **6-15 seconds** |
| Standard mode (5 agents) + any model | **20-40 seconds** |

## How to Ensure Fast Speed

### 1. Set Fastest Model in `.env`
```bash
GEMINI_MODEL=gemini-2.0-flash-lite
```

### 2. The Test Already Uses:
- ✅ `fastMode: true` (unified agent)
- ✅ `parsedAction` (skips intent parsing)

### 3. Verify Your Setup
```bash
# Check what model you're using
grep GEMINI_MODEL .env

# Should show:
# GEMINI_MODEL=gemini-2.0-flash-lite
```

## If Still Slow

1. **Check your model:**
   ```bash
   cat .env | grep GEMINI_MODEL
   ```

2. **Check network:**
   - Slow internet = slow API calls
   - VPN might add latency

3. **Check if fast mode is working:**
   - Look for `[ChatHandler] Using FAST MODE (unified agent)` in logs
   - If you see multiple agent calls, fast mode isn't working

4. **Try the fastest model:**
   ```bash
   echo "GEMINI_MODEL=gemini-2.0-flash-lite" >> .env
   npm run test:chat-real
   ```

## Model Speed Comparison

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `gemini-2.0-flash-lite` | ⚡⚡⚡ Fastest | Good | **Recommended for tests** |
| `gemini-2.0-flash` | ⚡⚡ Fast | Better | Production (balanced) |
| `gemini-2.5-flash` | ⚡ Medium | Best | Production (quality) |
| `gemini-1.5-pro` | 🐌 Slow | Excellent | Not recommended for tests |
