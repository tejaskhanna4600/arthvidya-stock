# Arthvidya Stock Exchange - Live Stock Market Simulation

A real-time stock market simulation web application for college fest events with multi-panel architecture and WebSocket synchronization.

## Application Overview

The application consists of three main panels accessible through a landing screen with authentication:
- Admin Control Panel (host interface)
- Screen Panel (projector display)
- Team Panel (participant trading interface)

## Landing Screen

- Welcome page with title "Welcome to Arthvidya Stock Exchange"
- Three navigation buttons leading to respective login pages
- Authentication credentials:
  - Admin Panel: ID `Tejas10`, Password `4600`
  - Screen Panel: ID `Tejas10`, Password `4600`
  - Team Panel: ID `Team1`, Password `Team1`

## Admin Control Panel

Complete host control interface with the following sections:

### Stock Management
- Create and edit stock names
- Set initial stock prices (₹2000-₹4000 range)
- Manual price editing after each round
- Real-time price updates broadcast to all panels

### Team Management
- Create teams with ₹10,000 starting balance
- View live portfolios (cash, stocks owned, total value)
- Add/remove money from any team
- Live leaderboard ranked by total portfolio value

### Round Control
- Start Round: Enables trading, starts timer, sets market status to "OPEN", plays buzzer sound
- End Round: Disables trading, sets market status to "CLOSED"
- Round counter display
- Market status synchronization across all panels

### News Control
- News input form (headline and description)
- Flash News button triggers animated "NEWS FLASH" on Screen Panel with sound alert

### Special Features
- Chaos Card button opens spinning wheel display on screen
- Buzzer sound effects for round start
- Real-time synchronization with all connected panels

## Screen Panel (Projector View)

Public display with stock exchange terminal aesthetic:

### Display Elements
- Live stock table showing names, prices in ₹, and price changes
- Round number and market status indicator ("OPEN"/"CLOSED")
- Timer display during active rounds
- Real-time leaderboard
- Historical line graphs per stock showing price trends
- Animated "NEWS FLASH" banner when triggered
- Dark neon aesthetic resembling trading floor screens

### Visual Features
- Professional dark theme with Bloomberg/Zerodha terminal styling
- Moving tickers and flashing alerts
- Sound effects for buzzer and news alerts
- Rupee currency formatting throughout

## Team Panel (Participant Interface)

Trading interface for teams during active rounds:

### Portfolio Management
- Display current cash balance and stocks owned
- Show total portfolio value and current rank
- Real-time portfolio value calculations

### Trading Features
- Live stock price display
- Buy/Sell actions (enabled only during active rounds)
- Purchase validation (cannot exceed available balance)
- Real-time transaction processing

### Information Display
- Latest flashed news
- Current market status
- Live portfolio synchronization with admin data

## Backend Data Storage

The backend stores the following data for the current session:

### Core Data
- Stock information (names, current prices, price history)
- Team data (names, cash balances, stock holdings, total values)
- Round state (current round number, market status, timer)
- News data (headlines, descriptions, flash status)

### Real-time Operations
- WebSocket connections for live synchronization
- Price update broadcasting
- Portfolio value calculations
- Market status management
- Trading transaction processing

## Technical Requirements

- Real-time WebSocket synchronization across all panels
- Session-only data persistence (no permanent storage)
- Multi-device simultaneous access over Wi-Fi
- Sound effects integration (buzzer, news alerts)
- Responsive design for different screen sizes
- Professional dark theme with animations
- Rupee currency formatting throughout the application
