# Image Tools
[![Build Status](https://travis-ci.org/a10nik/borbu-images.svg?branch=master)](https://travis-ci.org/a10nik/borbu-images)

### On the Subject of YC<sub>r</sub>C<sub>b</sub> Matrices

Here is what conversion to YC<sub>r</sub>C<sub>b</sub> looks like in accordance with out algorithm:

![](/readme-imgs/YCrCb-to.gif?raw=true)

When we convert it back to RGB, the RGB vector looks like this:

![](/readme-imgs/YCrCb-to-and-froh.gif?raw=true)

If we look more closely on multiplication of the two matrices

![](/readme-imgs/YCrCb-times-Inverse-YCrCb-input.gif?raw=true)

it will yield approximately:

![](/readme-imgs/YCrCb-times-Inverse-YCrCb-res.gif?raw=true)

That means, our RGB vector will come out multiplied by roughly an identity matrix, i.e. almost unchanged.

### JPEG comparison

|Quantization   |4:4:4 |      |      2top  |              |2left |      |            corner|      |
|---            |---   |---   |      ---   |---           |---   |---   |            ---   |---   |
|Ny=1,Nc=1      |1952  |16.560|      1908  |16.646        |1952  |16.639|            1914  |16.743|
|Ny=4,Nc=1      |3470  |21.435|      3426  |21.694        |3470  |21.673|            3432  |21.997|
|Ny=4,Nc=2      |4142  |21.539|      4104  |21.805        |4136  |21.783|            4078  |22.114|
|Ny=8,Nc=4      |6142  |24.183|      6124  |24.685        |5464  |24.091|            6186  |25.287|
|Ny=12,Nc=8     |8410  |25.485|      8640  |26.170        |8180  |25.814|            8734  |27.036|
|Qy(2,4),Qc(1,4)|3506  |29.059|      3482  |29.043        |3492  |29.027|            3492  |28.993|
|Qy(3,2),Qc(2,4)|3418  |29.956|      3414  |29.950        |3400  |29.909|            3408  |29.885|
|standard       |4940  |31.927|      4920  |31.892        |4934  |31.869|            4904  |31.827|
|standard/2     |6814  |31.354|      6742  |31.589        |6808  |31.124|            6760  |30.971|