#[derive(PartialEq, Clone, Copy, Eq)]
pub struct RgbPx {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

#[allow(dead_code)]
fn ycrcb_to_rgb(r: u8, g: u8, b: u8) -> (u8, u8, u8) {
    let y = (77 * r as i32 + 150 * g as i32 + 29 * b as i32) >> 8;
    let cr = ((128 * r as i32 + -107 * g as i32 + -21 * b as i32) >> 8) + 128;
    let cb = ((-43 * r as i32 + -85 * g as i32 + 128 * b as i32) >> 8) + 128;
    (y as u8, cr as u8, cb as u8)
}

#[allow(dead_code)]
fn rgb_to_ycrcb(y: u8, cr: u8, cb: u8) -> (u8, u8, u8) {
    let r = y as i32 + (256 * (cr as i32 - 128) / 183);
    let g = y as i32 - ((5329 * (cb as i32 - 128) + 11103 * (cr as i32 - 128)) / 15481);
    let b = y as i32 + (256 * (cb as i32 - 128) / 144);
    (r as u8, g as u8, b as u8)
}

fn map_image<F, T>(image: &Vec<Vec<RgbPx>>, func: F) -> Vec<Vec<T>> where F: Fn(RgbPx) -> T {
    image
        .iter()
        .map(|ln| ln
            .iter()
            .map(|px| func(*px))
            .collect())
        .collect()
}

pub fn to_rgb_channels(image: &Vec<Vec<RgbPx>>) -> (Vec<Vec<u8>>, Vec<Vec<u8>>, Vec<Vec<u8>>) {
    (map_image(image, |px| px.r), map_image(image, |px| px.g), map_image(image, |px| px.b))
}

#[cfg(test)]
mod tests {
    use channel::*;

    #[test]
    fn to_rgb_channels_extracts_rgb_channels() {
        let im = vec![vec![RgbPx{r: 0, g: 1, b: 2}, RgbPx{r: 3, g: 4, b: 5}]];
        let (r, g, b) = to_rgb_channels(&im);
        assert_eq!(r, vec![vec![0, 3]]);
        assert_eq!(g, vec![vec![1, 4]]);
        assert_eq!(b, vec![vec![2, 5]]);
    }

}
