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

"use strict"

class Fractus {
    constructor() {
        // Constants
        this.RADIUS = 2

        this.INITIAL_X = 0
        this.INITIAL_Y = 0
        this.INITIAL_MAGNIFICATION = 1
        this.MIN_MAGNIFICATION = 0.25

        this.MAX_RESOLUTION_FACTOR = 2
        this.RESOLUTION_DIVISOR = 16 * this.MAX_RESOLUTION_FACTOR
        this.MIN_RESOLUTION_FACTOR = this.MAX_RESOLUTION_FACTOR / this.RESOLUTION_DIVISOR

        this.TIMEOUT = 500
        // ---------

        this.canvas = document.getElementById("fractus")
        this.context = this.canvas.getContext("2d")

        this.x = this.INITIAL_X
        this.y = this.INITIAL_Y
        this.magnification = this.INITIAL_MAGNIFICATION

        this.resolutionFactor = this.MAX_RESOLUTION_FACTOR
        this.lowResMoveCompensation = null

        this.scaleFactor = null
        this.maxIterations = null

        this.offsetX = null
        this.offsetY = null

        this.timeoutHandle = null

        // 0: Mandelbrot - 1: Burning Ship
        this.fractal = 0

        this.setupEventListeners()
        this.getHash()
        this.setHash()
        this.minimizeResolution()
        this.maximizeResolution()
    }

    setupEventListeners() {
        this.canvas.onmousedown = event => this.mousedown(event)
        this.canvas.onwheel = event => this.magnify(event.x, event.y, 0.999 ** event.deltaY)

        onkeydown = event => event.key === "Backspace" ? this.reset() : null
        onresize = () => this.resize()
    }

    minimizeResolution() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle)
        } else {
            this.resolutionFactor = this.MIN_RESOLUTION_FACTOR
            this.update()
            this.move(-this.lowResMoveCompensation, -this.lowResMoveCompensation)
            this.draw()
        }
    }

    maximizeResolution() {
        this.timeoutHandle = setTimeout(() => {
            this.timeoutHandle = null

            this.move(this.lowResMoveCompensation, this.lowResMoveCompensation)

            this.setHash()

            this.resolutionFactor = this.MAX_RESOLUTION_FACTOR
            this.render()
        }, this.TIMEOUT)
    }

    reset() {
        if (confirm("Reset?")) {
            document.body.style.opacity = null

            setTimeout(() => {
                this.x = this.INITIAL_X
                this.y = this.INITIAL_Y
                this.magnification = this.INITIAL_MAGNIFICATION

                this.setHash()

                this.render()

                document.body.style.opacity = "1"
            }, 250)
        }
    }

    getHash() {
        let args = location.hash.slice(1).split(",")

        this.x = +args[0] || this.INITIAL_X
        this.y = +args[1] || this.INITIAL_Y
        this.magnification = Math.max(+args[2], this.MIN_MAGNIFICATION) || this.INITIAL_MAGNIFICATION
    }

    setHash() {
        history.replaceState(null, null, `#${this.x},${this.y},${this.magnification}`)
    }

    mousedown({button, clientX, clientY}) {
        if (button !== 0) {
            return
        }

        this.minimizeResolution()

        document.body.style.cursor = "move"

        onmousemove = event => {
            this.move(event.clientX - clientX, event.clientY - clientY)
            this.draw()

            clientX = event.clientX
            clientY = event.clientY
        }

        onmouseup = () => {
            document.body.style.cursor = null
            onmousemove = null
            onmouseup = null

            this.maximizeResolution()
        }
    }

    move(deltaX, deltaY) {
        this.x -= deltaX * this.scaleFactor * this.resolutionFactor * devicePixelRatio
        this.y += deltaY * this.scaleFactor * this.resolutionFactor * devicePixelRatio

        let distance = Math.hypot(this.x, this.y)

        if (distance > this.RADIUS) {
            let rad = Math.atan2(this.y, this.x)

            this.x = Math.cos(rad) * this.RADIUS
            this.y = Math.sin(rad) * this.RADIUS
        }

        this.update()
    }

    magnify(x, y, scale) {
        this.minimizeResolution()

        let offsetX = (this.canvas.width / 2 / this.resolutionFactor / devicePixelRatio - x) * (scale - 1)
        let offsetY = (this.canvas.height / 2 / this.resolutionFactor / devicePixelRatio - y) * (scale - 1)

        this.magnification *= scale

        if (this.magnification < this.MIN_MAGNIFICATION) {
            this.magnification = this.MIN_MAGNIFICATION
        }

        this.update()
        this.move(offsetX, offsetY)
        this.draw()

        this.maximizeResolution()
    }

    resize() {
        this.minimizeResolution()
        this.render()
        this.maximizeResolution()
    }

    update() {
        let width = Math.round(innerWidth * this.resolutionFactor * devicePixelRatio)
        let height = Math.round(innerHeight * this.resolutionFactor * devicePixelRatio)

        this.canvas.width = width
        this.canvas.height = height

        this.scaleFactor = (2 * this.RADIUS) / (width > height ? height : width) / this.magnification
        this.maxIterations = Math.round(Math.sqrt(2 * Math.sqrt(Math.abs(1 - 5 * this.magnification))) * 64)

        let ratioX, ratioY
        ratioX = ratioY = 1 / this.magnification

        if (width > height) {
            ratioX *= width / height
        } else {
            ratioY *= height / width
        }

        this.offsetX = (this.RADIUS * ratioX - this.x)
        this.offsetY = (this.RADIUS * ratioY - this.y)

        this.lowResMoveCompensation = (
            this.RESOLUTION_DIVISOR
            / (2 * this.MAX_RESOLUTION_FACTOR * devicePixelRatio)
            - (1 / (2 * this.MAX_RESOLUTION_FACTOR))
        )
    }

    draw() {
        let s = new Date()
        let {width, height} = this.canvas

        const p = __Z4drawjjjdddjj(
            width, height,
            this.maxIterations,
            this.scaleFactor,
            this.offsetX, this.offsetY,
            84, this.fractal
        )

        const view = new Uint8ClampedArray(Module.HEAP8.buffer, p, width * height * 4)
        this.context.putImageData(new ImageData(new Uint8ClampedArray(view), width, height), 0, 0)
        console.log("Draw:", new Date() - s, "ms")
    }

    render() {
        this.update()
        this.draw()
    }
}
