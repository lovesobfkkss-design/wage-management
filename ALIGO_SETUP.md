# Aligo Setup

## Vercel Environment Variables
- `ALIGO_USER_ID`
- `ALIGO_API_KEY`
- `ALIGO_SENDER`

## Where To Set Them
Vercel Project Settings -> Environment Variables

## Required Before Sending
- Register the sender phone number in Aligo
- Confirm your Aligo account unit price and balance
- Deploy after environment variables are saved

## Current Implementation
- Admin-only send flow from the `문자생성` tab
- Test send supported
- Real send supported
- Send logs stored in academy data as `messageLogs`

## Notes
- Do not put Aligo credentials in frontend files
- Do not commit credentials into Git
