#!/bin/bash

# Terminal 1 - Client
gnome-terminal -- bash -c "cd client && npm run dev; exec bash"

# Terminal 2 - Server
gnome-terminal -- bash -c "cd server && npm run dev; exec bash"