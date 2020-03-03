/*
 * MIT License
 *
 * Copyright (c) 2020 Dan <https://github.com/delivrance>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include <emscripten.h>
#include <iostream>
#include <thread>
#include <cmath>
#include "fractus.h"

uint8_t *buffer = nullptr;
uint32_t prevSize = 0;

void mandelbrot(complex_t &z, complex_t &c) {
    z = complex_t{
        z.real * z.real - z.imag * z.imag + c.real,
        2 * z.real * z.imag + c.imag
    };
}

void burningShip(complex_t &z, complex_t &c) {
    z = complex_t{
        z.real * z.real - z.imag * z.imag + c.real,
        -abs(2 * z.real * z.imag) + c.imag
    };
}

double lerp(double a, double b, double f) {
    return a * (1 - f) + b * f;
}

void worker(
    uint32_t width, uint32_t height, uint32_t maxIterations, double scaleFactor,
    double offsetX, double offsetY, uint32_t offsetPalette, uint32_t n, uint32_t fractal
) {
    for (uint32_t y = n; y < height; y += THREAD_COUNT) {
        for (uint32_t x = 0; x < width; x++) {
            complex_t c = {x * scaleFactor - offsetX, (height - y) * scaleFactor - offsetY};
            complex_t z = {0, 0};

            double iterations = 0;

            while (z.real * z.real + z.imag * z.imag <= BAILOUT_RADIUS && iterations < maxIterations) {
                switch (fractal) {
                    case 0:
                        mandelbrot(z, c);
                        break;
                    case 1:
                        burningShip(z, c);
                        break;
                    default:
                        break;
                }

                iterations++;
            }

            if (iterations < maxIterations) {
                iterations += 1 - log(z.real * z.real + z.imag * z.imag) / log(BAILOUT_RADIUS);
            } else {
                iterations = 0;
            }

            iterations += offsetPalette;

            auto pos = (width * y + x) * 4;
            auto color1 = PALETTE[((uint32_t) iterations) % PALETTE_SIZE];
            auto color2 = PALETTE[((uint32_t) iterations + 1) % PALETTE_SIZE];
            auto fraction = iterations - (uint32_t) iterations;

            buffer[pos] = (uint8_t) lerp(color1[0], color2[0], fraction);
            buffer[pos + 1] = (uint8_t) lerp(color1[1], color2[1], fraction);
            buffer[pos + 2] = (uint8_t) lerp(color1[2], color2[2], fraction);
            buffer[pos + 3] = 255;
        }
    }
}

EMSCRIPTEN_KEEPALIVE
uint8_t *draw(
    uint32_t width, uint32_t height, uint32_t maxIterations, double scaleFactor,
    double offsetX, double offsetY, uint32_t offsetPalette, uint32_t fractal
) {
    auto size = width * height * 4;

    if (prevSize != size) {
        free(buffer);
        buffer = (uint8_t *) malloc(size);
    }

    std::thread threads[THREAD_COUNT];

    for (uint32_t n = 0; n < THREAD_COUNT; n++) {
        threads[n] = std::thread(
            worker,
            width, height,
            maxIterations,
            scaleFactor,
            offsetX, offsetY,
            offsetPalette, n,
            fractal
        );
    }

    for (auto &thread : threads) {
        thread.join();
    }

    return buffer;
}
