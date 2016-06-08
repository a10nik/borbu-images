#[derive(PartialEq, Clone, Copy, Eq)]
pub struct RgbPx {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}


pub struct Image {
    pub pxs: Vec<Vec<RgbPx>>
}

impl Image {
    pub fn map<F, T>(&self, func: F) -> Vec<Vec<T>> where F: Fn(RgbPx) -> T {
        self.pxs
            .iter()
            .map(|ln| ln
                .iter()
                .map(|px| func(*px))
                .collect())
            .collect()
    }
}


#[cfg(test)]
mod tests {
    use image::*;
    #[test]
    fn map_square_extracts_red_channel() {
        let im = Image { pxs: vec![
            vec![RgbPx { r: 0, g: 1, b: 2 }, RgbPx { r: 3, g: 4, b: 5 }, RgbPx { r: 6, g: 7, b: 8 }, RgbPx { r: 9, g: 10, b: 11 }],
            vec![RgbPx { r: 12, g: 13, b: 14 }, RgbPx { r: 15, g: 16, b: 17 }, RgbPx { r: 18, g: 19, b: 20 }, RgbPx { r: 21, g: 22, b: 23 }],
            vec![RgbPx { r: 24, g: 25, b: 26 }, RgbPx { r: 27, g: 28, b: 29 }, RgbPx { r: 30, g: 31, b: 32 }, RgbPx { r: 33, g: 34, b: 35 }],
            ] };
        let r_square = im.map(|px| px.r);
        assert_eq!(r_square, vec![
            vec![0, 3, 6, 9],
            vec![12, 15, 18, 21],
            vec![24, 27, 30, 33],
            ]);
    }
}
