# [Fractus](//delivrance.github.io/fractus)

> Elegant Fractal Explorer web application written in C++ (WebAssembly) and JavaScript

<a href="http://delivrance.github.io/fractus/#-1.7857286545009528,0.000041546098869800305,7808027309.753782">
    <img src="https://i.imgur.com/UxQqT1A.png" alt="Fractus header image">
</a>

**Fractus** is a WebAssembly-based web application written in C++ and JavaScript that allows you to explore the
two-dimensional realm of the Mandelbrot set. Fractus is built from the ground up to be a fast, easy and pleasant to use
Fractal Explorer that runs on a web browser. You can start using Fractus right away by visiting
[**delivrance.github.io/fractus**](//delivrance.github.io/fractus).

## Features

- Written in multi-threaded C++ code compiled to WebAssembly (wasm).
- Gorgeous palette making up beautiful shades of colors as you explore.
- Move and zoom with your mouse: drag to move, wheel to zoom.
- Bookmark and share links of the exact fractal positions.
- Save images with Right Click > Save Image As...
- Reset the fractal view by hitting Backspace.

## Limitations

- Fractus makes use of threads and shared array buffers, features currently available OOB only in Chromium-based
browsers such as Google Chrome, Microsoft Edge and Opera. Other browsers might work if you fiddle with their
configurations and enable experimental flags.
- Currently working on desktop browsers only.

## ToDo

- [ ] Add support for mobile browsers and gestures.
- [ ] Add more fractals to explore (e.g.: Julia, Burning Ship).
- [ ] Find a way to keep renderings outside the main thread.
- [ ] Find a way to cancel an ongoing rendering.
- [ ] Add a progress bar as feedback for the ongoing rendering.

## Build

1. Install and configure `emscripten`.
2. Enter the directory `cd src/wasm`.
3. Run `emcc -O3 -s TOTAL_MEMORY=256MB -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=16 -std=c++2a -o fractus.js fractus.cpp`.

## License

MIT © 2020 [Dan](https://github.com/delivrance)
