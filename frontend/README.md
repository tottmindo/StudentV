# StudentV Frontend

Vue/Vite frontend for the StudentV/DORMS app.

## Features

- View water consumption stats (hourly, daily, weekly, monthly)
- Responsive design

## Tech Stack

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Chart.js](https://www.chartjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Development

From the repository root:

```sh
npm install
npm run dev
```

To run only the frontend from this directory:

```sh
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` for HTTP and Socket.IO connections. If it is not set, it falls back to `http://localhost:3000`.

## Build

From the repository root:

```sh
npm run build
```

Or from this directory:

```sh
npm run build
```

## Folder Structure

- `src/views/StatsView.vue` - Main statistics dashboard
- `src/components/NavComponent.vue` - Navigation menu

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the [MIT License](LICENSE).
