extern crate image;
mod channel;
mod byte_rect;
mod fractal;
use std::path::Path;

use image::GenericImage;

fn encode_and_decode_ch(ch: Vec<Vec<u8>>) -> Vec<Vec<u8>> {
    let c = fractal::compress(&ch, fractal::CompSettings { small_square_size: 4, big_square_size: 16, grouping_factor: 20 });
    fractal::decompress(&c, fractal::DecompSettings { iterations: 20 })
}

fn main() {
    let img = image::open(&Path::new("in.png")).unwrap();
    let (width, height) = img.dimensions();
    let rgb = (0..height)
        .map(|y|
            (0..width)
                .map(|x| img.get_pixel(x, y).data)
                .map(|px| channel::RgbPx { r: px[0], g: px[1], b: px[2] })
                .collect::<Vec<_>>())
        .collect::<Vec<_>>();
    let (rs, gs, bs) = channel::to_rgb_channels(&rgb);
    let (rs_p, gs_p, bs_p) = (
        encode_and_decode_ch(rs), encode_and_decode_ch(gs), encode_and_decode_ch(bs)
    );
    let res_img = image::ImageBuffer::from_fn(width, height, |x_i, y_i| {
        let (x, y) = (x_i as usize, y_i as usize);
        image::Rgb([rs_p[y][x], gs_p[y][x], bs_p[y][x]])
    });
    let _ = res_img.save(&Path::new("out.png")).unwrap();
}
