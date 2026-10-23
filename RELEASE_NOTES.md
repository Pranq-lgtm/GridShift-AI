# GridShift-AI v0.1

**Release date:** October 23, 2026

GridShift-AI v0.1 is the initial release of the waste-surge forecasting platform for municipal sanitation teams. It combines civic event data, machine-learning predictions, and an AI copilot to help fleet managers plan collection resources before localized waste pressure becomes an overflow.

## Highlights

- **Predictive waste-pressure map** with 3D geospatial visualization of forecasted neighborhood surges.
- **Municipal permit ingestion** for construction activity, public gatherings, street fairs, and food festivals.
- **XGBoost forecasting service** that estimates event-related waste tonnage and assigns a pressure level.
- **AI Waste Surge Copilot** powered by Google Gemini, providing explanations, timing, recommendations, and confidence for each forecast.
- **Fleet operations dashboard** with dashboard, fleet, and analytics views.
- **Waste reporting camera flow** for submitting on-the-ground waste observations.
- **Google authentication** through Firebase, with demo-user support for local exploration.
- **REST services** for health checks, permit retrieval, bulk permit ingestion, and forecast integration.
- **Newsletter/waitlist subscription endpoint** with Mailchimp integration support.

## Architecture

This release includes:

- React and Vite frontend
- Node.js and Express backend
- FastAPI and XGBoost machine-learning service
- MongoDB persistence through Mongoose
- Firebase authentication
- Mapbox and Deck.gl geospatial visualization

## Getting started

See the [README](README.md) for prerequisites, environment variables, local startup instructions, sample payloads, and deployment guidance.

## Known limitations

- Forecast quality depends on the available training and event data.
- External services require local configuration, including MongoDB, Firebase, Mapbox, and Gemini credentials.
- The municipal data scraper currently uses synthetic permit data for demonstration.
- Production deployments must configure secrets independently in their hosting environments.
