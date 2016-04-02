# Image Tools
[![Build Status](https://travis-ci.org/a10nik/borbu-images.svg?branch=master)](https://travis-ci.org/a10nik/borbu-images)

### On the Subject of YC<sub>r</sub>C<sub>b</sub> Matrices

Here is what conversion to YC<sub>r</sub>C<sub>b</sub> looks like in accordance with out algorithm:

![](/readme-imgs/YCrCb-to.gif?raw=true)

When we convert it back into RGB, the RGB vector looks like this:

![](/readme-imgs/YCrCb-to-and-froh.gif?raw=true)

If we look more closely on multiplication of the two matrices

![](/readme-imgs/YCrCb-times-Inverse-YCrCb-input.gif?raw=true)

it will yield approximately:

![](/readme-imgs/YCrCb-times-Inverse-YCrCb-res.gif?raw=true)
