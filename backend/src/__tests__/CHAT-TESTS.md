# Chat Interface Tests

## Overview

Tests for the chat-based financial advisor interface, covering both mock (no API calls) and real API scenarios.

## Test Files

### 1. `chat.test.ts` - Mock Tests (No API Calls)
**Command:** `npm run test:chat`

Tests all chat functionality using mock agents and mock intent parsing. Fast and safe for CI/CD.

**Test Coverage:**
- ✅ Basic intent parsing
- ✅ Conversation memory (context tracking)
- ✅ Different intent types (simulate, compare, recommend, etc.)
- ✅ Fast mode with parsed actions
- ✅ Response formatting
- ✅ Error handling

**Expected Runtime:** < 1 second

### 2. `test-chat-real.ts` - Real API Test (Minimal Calls)
**Command:** `npm run test:chat-real`

Makes **ONE** real API call to OpenAI to verify the chat interface works with the actual LLM.

**What it tests:**
- Real intent parsing with OpenAI
- Fast mode (unified agent = 1 LLM call)
- Response structure validation
- Response time measurement

**Expected Runtime:** 3-10 seconds (depending on model)

**Requirements:**
- `OPENAI_API_KEY` must be set in `.env`
- `USE_MOCK_AGENTS` must NOT be `true`
- Will skip automatically if API key is missing

## Running Tests

```bash
# Run all mock tests (fast, no API calls)
npm run test:chat

# Run real API test (requires API key, makes 1 call)
npm run test:chat-real
```

## Test Results

### Mock Tests
All 6 tests should pass:
1. ✅ Basic Intent Parsing
2. ✅ Conversation Memory
3. ✅ Different Intent Types (4/4 matched)
4. ✅ Fast Mode with Parsed Action
5. ✅ Response Formatting
6. ✅ Error Handling

### Real API Test
- ✅ Response received in <10s (good) or <30s (acceptable)
- ✅ Response structure valid
- ✅ Fast mode working
- ✅ Intent parsed correctly

## Notes

- Mock tests use keyword-based intent parsing (not LLM)
- Mock tests use rule-based agent responses
- Real API test uses `fastMode: true` to minimize API calls (1 instead of 5)
- Real API test will skip if no API key is available (graceful degradation)
