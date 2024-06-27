#!/bin/bash

# Update handleSetTpinSubmit to uncomment OTP validation
sed -i '' '/\/\/ Bypass OTP verification check for testing\/enablement/d' app/screens/myWalletTransfer/MyWalletTransfer.tsx
sed -i '' '/\/\*/,/\*\//d' app/screens/myWalletTransfer/MyWalletTransfer.tsx

# Wait, the comment block might be more specific. Let's just do a specific sed for that.
