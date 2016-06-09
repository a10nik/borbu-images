use std::cmp;

#[derive(Debug, PartialEq, Clone, Copy, Eq)]
pub enum Transform {
    HeadToTop, HeadToRight, HeadToBottom, HeadToLeft,
    HeadToTopInv, HeadToRightInv, HeadToBottomInv, HeadToLeftInv,
}

#[derive(Debug, PartialEq, Clone, Copy)]
pub struct LinearCoeffs {
    pub shift: i16,
    pub factor: f32
}

fn rect_avg(vec: &Vec<Vec<u8>>, x: usize, y: usize, side: usize) -> u8 {
    (vec[y..y+side].iter()
        .map(|ln| ln[x..x + side].iter().fold(0, |a, &el| a + el as usize))
        .fold(0, |x, y| x + y as usize) / (side * side)) as u8
}

pub trait ByteRect where Self: Sized {
    fn get_rect(&self, x: usize, y: usize, width: usize, height: usize) -> Self;
    fn get_square(&self, sq: SquareCoords) -> Self {
        self.get_rect(sq.x, sq.y, sq.side, sq.side)
    }
    fn transform(&self, Transform) -> Self;
    fn scale_down(&self, times: usize) -> Self;
    fn linear(&self, LinearCoeffs) -> Self;
    fn best_coeffs_to_match(&self, other: &Self) -> LinearCoeffs;
    fn dist(&self, other: &Self) -> u64;
    fn roughness(&self) -> u64 {
        let w = self.width();
        let h = self.height();
        if w < 2 || h < 2 {
            1
        } else {
            self.get_rect(0, 0, w - 1, h - 1).dist(
                &self.get_rect(1, 1, w - 1, h - 1)
            )
        }
    }
    fn pad_to_divisible_by(&self, divisor: usize) -> Self;
    fn to_square_chunks(&self, size: usize) -> Vec<(SquareCoords, Self)>;
    fn width(&self) -> usize;
    fn height(&self) -> usize;
}

#[derive(Debug, PartialEq, Clone, Copy, Eq)]
pub struct SquareCoords {
    pub x: usize,
    pub y: usize,
    pub side: usize,
}

impl ByteRect for Vec<Vec<u8>> {
    fn width(&self) -> usize {
        self[0].len()
    }

    fn height(&self) -> usize {
        self.len()
    }

    fn transform(&self, t: Transform) -> Self {
        let width = self[0].len();
        let height = self.len();
        let (x_rev, y_rev, ord_rev) = match t {
            Transform::HeadToTop => (false, false, false),
            Transform::HeadToRight => (true, false, true),
            Transform::HeadToBottom => (true, true, false),
            Transform::HeadToLeft => (false, true, true),
            Transform::HeadToTopInv => (true, false, false),
            Transform::HeadToRightInv => (false, false, true),
            Transform::HeadToBottomInv => (false, true, false),
            Transform::HeadToLeftInv => (true, true, true),
        };
        let translate = |x: usize, y: usize| {
            let x_trans = if x_rev {width - x - 1} else {x};
            let y_trans = if y_rev {height - y - 1} else {y};
            self[y_trans][x_trans]
        };
        if ord_rev {
            (0..width).map(|x| (0..height).map(|y| translate(x, y)).collect()).collect()
        } else {
            (0..height).map(|y| (0..width).map(|x| translate(x, y)).collect()).collect()
        }
    }

    fn scale_down(&self, times: usize) -> Self {
        let width = self[0].len();
        let height = self.len();
        if height % times != 0 || width % times != 0 {
            panic!(format!("Can only scale the multiples of {}", times))
        }
        (0..height/times).map(|y|
            (0..width/times).map(|x|
                rect_avg(self, x * times, y * times, times)).collect()).collect()
    }

    fn linear(&self, c: LinearCoeffs) -> Self {
        self.iter().map(|ln|
            ln.iter().map(|&x|
                (x as f32).mul_add(c.factor, c.shift as f32).min(255.0).max(0.0) as u8)
            .collect()).collect()
    }

    fn best_coeffs_to_match(&self, other: &Self) -> LinearCoeffs {
        let width = self.width();
        let height = self.height();
        if other.height() != height || other.width() != width {
            panic!("can't handle different dimensions {}x{} and {}x{}",
                width, height, other.width(), other.height());
        }
        let self_sum = self.iter().map(|ln|
                ln.iter().fold(0, |a, &el| a + el as i64))
            .fold(0, |x, y| x + y);
        let other_sum = other.iter().map(|ln|
                    ln.iter().fold(0, |a, &el| a + el as i64))
                .fold(0, |x, y| x + y);
        let self_sqr_sum = self.iter().map(|ln|
                ln.iter().fold(0, |a, &el| a + el as i64 * el as i64))
            .fold(0, |x, y| x + y);
        let count = (self.len() * self[0].len()) as i64;
        let prod_sum = (0..height)
            .map(|y|
                (0..width)
                    .map(|x| self[y][x] as i64 * other[y][x] as i64)
                    .fold(0, |a, el| a + el))
            .fold(0, |a, el| a + el);
        let det = self_sqr_sum * count - self_sum * self_sum;
        LinearCoeffs {
            shift: ((self_sqr_sum * other_sum - prod_sum * self_sum) as f32 / det as f32).round() as i16,
            factor: ((prod_sum * count) as f32 - (self_sum * other_sum) as f32) / det as f32
        }
    }

    fn get_rect(&self, x: usize, y: usize, width: usize, height: usize) -> Self {
        self[y..y + height]
            .iter()
            .map(|ln| ln[x..x + width].to_vec())
            .collect()
    }

    fn dist(&self, other: &Self) -> u64 {
        let width = self.width();
        let height = self.height();
        if other.height() != height || other.width() != width {
            panic!("can't handle different dimensions {}x{} and {}x{}",
                width, height, other.width(), other.height());
        }
        (0..height)
            .map(|y| (0..width)
                .map(|x| self[y][x] as i32 - other[y][x] as i32)
                .map(|diff| diff * diff)
                .fold(0, |a, diff| a + diff as u64))
            .fold(0, |a, el| a + el)
    }

    fn pad_to_divisible_by(&self, divisor: usize) -> Self {
        let round = |x: usize| {
            (x + divisor - 1) / divisor * divisor
        };
        let orig_width = self[0].len();
        let orig_height = self.len();
        let width = round(orig_width);
        let height = round(orig_height);
        (0..height)
            .map(|y| (0..width)
                .map(|x| self[cmp::min(y, orig_height - 1)][cmp::min(x, orig_width - 1)])
                .collect())
            .collect()
    }

    fn to_square_chunks(&self, size: usize) -> Vec<(SquareCoords, Self)> {
        let width = self[0].len();
        let height = self.len();
        if height % size != 0 || width % size != 0 {
            panic!("can't chunk what is not divisible by chunk size");
        }
        (0..height / size)
            .flat_map(|chunk_y| (0..width / size)
                .map(move |chunk_x| SquareCoords {
                    x: chunk_x * size,
                    y: chunk_y * size,
                    side: size,
                })
                .map(|coords| (coords, self.get_square(coords)))
            )
            .collect()
    }
}


#[cfg(test)]
mod tests {
    use byte_rect::*;

    #[test]
    fn rotates_byte_rect() {
        let byte_rect = vec![
            vec![1, 2],
            vec![3, 4],
            vec![5, 6],
        ];
        let transformed = byte_rect.transform(Transform::HeadToRightInv);
        assert_eq!(transformed, vec![
            vec![1, 3, 5],
            vec![2, 4, 6],
        ]);
    }

    #[test]
    fn scales_rect_down_twice() {
        let byte_rect = vec![
            vec![1, 2],
            vec![3, 4],
            vec![5, 6],
            vec![7, 8],
        ];
        let scaled = byte_rect.scale_down(2);
        assert_eq!(scaled, vec![
            vec![2],
            vec![6],
            ]);
    }

    #[test]
    fn linear_multiplies_and_shifts_all_values() {
        let byte_rect = vec![
            vec![1, 2],
            vec![3, 4],
            vec![5, 6],
            vec![7, 8],
        ];
        let lineared = byte_rect.linear(LinearCoeffs { shift: 10, factor: -2.0 });
        assert_eq!(lineared, vec![
            vec![8, 6],
            vec![4, 2],
            vec![0, 0],
            vec![0, 0],
        ]);
    }

    #[test]
    fn least_squares_finds_the_perfect_shift_only_match() {
        let byte_rect = vec![
            vec![10, 20],
            vec![30, 40],
        ];
        let desired = vec![
            vec![120, 130],
            vec![140, 150],
        ];
        let LinearCoeffs{shift, factor} = byte_rect.best_coeffs_to_match(&desired);
        assert_eq!(shift, 110);
        assert!((factor - 1.0).abs() < 0.001, "factor was {}", factor);
    }

    #[test]
    fn linear_with_best_coeffs_yields_perfecly_the_same() {
        let byte_rect = vec![
            vec![6, 5, 4],
            vec![3, 2, 1],
        ];
        let desired = vec![
            vec![10, 20, 30],
            vec![40, 50, 60],
        ];
        let coeffs = byte_rect.best_coeffs_to_match(&desired);
        let adjusted = byte_rect.linear(coeffs);
        assert_eq!(adjusted, desired);
    }

    #[test]
    fn euclid_dist_works_correctly() {
        let r1 = vec![
            vec![10, 20, 30],
            vec![40, 50, 60],
        ];
        let r2 = vec![
            vec![12, 20, 30],
            vec![40, 50, 58],
        ];
        assert_eq!(r1.dist(&r2), 8);
    }

    #[test]
    fn linear_with_best_coeffs_yields_closer_than_intuitive() {
        let byte_rect = vec![
            vec![6, 5, 4],
            vec![3, 3, 1],
        ];
        let desired = vec![
            vec![10, 20, 30],
            vec![40, 50, 60],
        ];
        let coeffs = byte_rect.best_coeffs_to_match(&desired);
        let adjusted = byte_rect.linear(coeffs);
        let intuitive_adjusted = vec![
            vec![10, 20, 30],
            vec![40, 40, 60],
        ];
        assert!(desired.dist(&intuitive_adjusted) > desired.dist(&adjusted));
    }

    #[test]
    fn pad_to_divisible_by_3_leaves_divisible_boundaries_untouched() {
        let byte_rect = vec![
            vec![1, 2, 3],
            vec![4, 5, 6],
            vec![7, 8, 9],
            vec![1, 2, 3],
            vec![4, 5, 6],
            vec![7, 8, 9],
        ];
        let padded = byte_rect.pad_to_divisible_by(3);
        assert_eq!(padded, byte_rect);
    }

    #[test]
    fn pad_to_divisible_by_3_padds_non_divisible_boundaries() {
        let byte_rect = vec![
            vec![1, 2],
            vec![3, 4],
            vec![5, 6],
            vec![7, 8],
        ];
        let padded = byte_rect.pad_to_divisible_by(3);
        let expected_padded = vec![
            vec![1, 2, 2],
            vec![3, 4, 4],
            vec![5, 6, 6],
            vec![7, 8, 8],
            vec![7, 8, 8],
            vec![7, 8, 8],
        ];
        assert_eq!(padded, expected_padded);
    }

    #[test]
    fn to_square_chunks_works() {
        let byte_rect = vec![
            vec![11, 12, 13, 14],
            vec![21, 22, 23, 24],
        ];
        let chunks = byte_rect.to_square_chunks(2);
        let expected_chunks = vec![
            (SquareCoords { x: 0, y: 0, side: 2 },
                vec![
                    vec![11, 12],
                    vec![21, 22],
                ]),
            (SquareCoords { x: 2, y: 0, side: 2 },
                vec![
                    vec![13, 14],
                    vec![23, 24],
                ]),
        ];
        assert_eq!(chunks, expected_chunks);
    }
}
