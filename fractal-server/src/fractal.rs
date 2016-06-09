use byte_rect::*;

static TRANSFORMS: &'static [Transform] = &[
    Transform::HeadToTop, Transform::HeadToRight, Transform::HeadToBottom, Transform::HeadToLeft,
    Transform::HeadToTopInv, Transform::HeadToRightInv, Transform::HeadToBottomInv, Transform::HeadToLeftInv,
];

pub fn find_closest_square<'a, 'b, R>(squares: &'a [R], desired: &'b R) -> (usize, Transform, LinearCoeffs) where R: ByteRect {
    let (best_i, best_transform, best_coeffs, _) = squares.iter()
        .enumerate()
        .flat_map(|(i, sq)| TRANSFORMS.iter().map(move |&t| (i, t, sq.transform(t))))
        .map(|(i, t, sq)| (i, t, sq.best_coeffs_to_match(desired), sq))
        .min_by_key(|&(_, _, _, ref sq)| desired.dist(&sq.linear(sq.best_coeffs_to_match(desired))))
        .unwrap();
    (best_i, best_transform, best_coeffs)
}

#[derive(Debug, PartialEq, Clone, Copy)]
pub struct SquareMapping {
    pub small: SquareCoords,
    pub big: SquareCoords,
    pub trans: Transform,
    pub coeffs: LinearCoeffs,
}

fn get_closest_chunk_mapping<R>(padded: &R, big_grid_size: usize, small_grid_size: usize, group_count: usize) -> Vec<SquareMapping> where R: ByteRect {
    let small_grid = padded.to_square_chunks(small_grid_size);
    let big_grid = padded.to_square_chunks(big_grid_size);
    let mut big_grid_with_roughness = big_grid
        .iter()
        .map(|&(cs, ref big_chunk)| (cs, big_chunk.scale_down(big_grid_size / small_grid_size)))
        .map(|(cs, chunk)| (cs, chunk.roughness(), chunk))
        .collect::<Vec<(SquareCoords, u64, R)>>();
    big_grid_with_roughness.sort_by_key(|&(_, r, _)| r);
    let (big_coords, big_squares): (Vec<_>, Vec<R>) = big_grid_with_roughness
        .into_iter()
        .map(|(cs, _, chunk)| (cs, chunk))
        .unzip();
    let mut i = 0;
    small_grid
        .iter()
        .map(|&(small_cs, ref small_chunk)| {
            i += 1;
            if i % 100 == 0 {
                println!("processing {} out of {}", i, small_grid.len());
            }
            let (best_i, best_trans, best_coeffs) = find_closest_square(&big_squares[0..big_squares.len() / group_count], &small_chunk);
            SquareMapping { small: small_cs, big: big_coords[best_i], trans: best_trans, coeffs: best_coeffs }
        })
        .collect()
}

#[derive(Debug, PartialEq, Clone)]
pub struct Compressed {
    pub orig_width: usize,
    pub orig_height: usize,
    pub padded_width: usize,
    pub padded_height: usize,
    pub mapping: Vec<SquareMapping>,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct CompSettings {
    pub big_square_size: usize,
    pub small_square_size: usize,
    pub grouping_factor: usize,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct DecompSettings {
    pub iterations: usize,
}

pub fn compress(image: &Vec<Vec<u8>>, settings: CompSettings) -> Compressed {
    let padded = image.pad_to_divisible_by(settings.big_square_size);
    let mapping = get_closest_chunk_mapping(&padded, settings.big_square_size, settings.small_square_size, settings.grouping_factor);
    Compressed {
        orig_width: image[0].len(),
        orig_height: image.len(),
        padded_width: padded[0].len(),
        padded_height: padded.len(),
        mapping: mapping,
    }
}

pub fn decompress(comp: &Compressed, settings: DecompSettings) -> Vec<Vec<u8>> {
    let image: Vec<Vec<u8>> = (0..comp.padded_height)
        .map(|_| (0..comp.padded_width).map(|_| 128).collect())
        .collect();
    let iterated = apply_square_mapping_rec(&image, &comp.mapping, settings.iterations);
    iterated.get_rect(0, 0, comp.orig_width, comp.orig_height)
}

fn apply_square_mapping_rec(image: &Vec<Vec<u8>>, mapping: &Vec<SquareMapping>, depth: usize) -> Vec<Vec<u8>> {
    let mut result: Vec<Vec<u8>> = image.clone();
    for &map in mapping.iter() {
        let SquareMapping { small, big, trans, coeffs } = map;
        assert!(big.side % small.side == 0, "can't scale when big side is not divisible by small side");
        let new_square = image
            .get_square(big)
            .scale_down(big.side / small.side)
            .transform(trans)
            .linear(coeffs);
        for x in 0..small.side {
            for y in 0..small.side {
                result[small.y + y][small.x + x] = new_square[y][x];
            }
        }
    }
    if depth == 1 { result } else { apply_square_mapping_rec(&result, mapping, depth - 1) }
}



#[cfg(test)]
mod tests {
    use fractal::*;
    use byte_rect::*;

    #[test]
    fn clone_on_2d_vec_is_deep() {
        let v: Vec<Vec<i32>> = vec![vec![1, 2, 3]];
        let mut v2: Vec<Vec<i32>> = v.clone();
        v2[0][1] = -2;
        assert_eq!(v, vec![vec![1,2,3]]);
        assert_eq!(v2, vec![vec![1,-2,3]]);
    }

    #[test]
    fn find_closest_rect_chooses_the_perfect_matching_out_of_three() {
        let desired = vec![
            vec![1, 2],
            vec![3, 4]
        ];
        let options = vec![
            vec![
                vec![3, 2],
                vec![2, 0]
            ],
            vec![
                vec![6, 2],
                vec![4, 0]
            ],
            vec![
                vec![5, 5],
                vec![5, 5]
            ],
        ];
        let (best_match_index, best_trans, best_coeffs) = find_closest_square(&options, &desired);
        assert_eq!(best_match_index, 1);
        assert_eq!(best_trans, Transform::HeadToRightInv);
        assert_eq!(best_coeffs, LinearCoeffs { shift: 4, factor: -0.5 } )
    }

    #[test]
    fn closest_chunks_chooses_as_many_matches_as_there_are_small_squares() {
        let picture = vec![
            vec![11, 12, 13, 14, 15,],
            vec![21, 22, 23, 24, 25,],
            vec![31, 32, 33, 34, 35,],
            vec![41, 42, 43, 44, 45,],
            vec![51, 52, 53, 54, 55,],
            vec![61, 62, 63, 64, 65,],
            vec![71, 72, 73, 74, 75,],
        ];
        let Compressed{mapping, ..} = compress(&picture, CompSettings {
            big_square_size: 4,
            small_square_size: 2,
            grouping_factor: 1,
        });
        let small_square_count = 4 * 4;
        assert_eq!(mapping.len(), small_square_count);
    }

    #[test]
    fn restores_image_to_original_size() {
        let picture = vec![
            vec![11, 12, 13, 14, 15,],
            vec![21, 22, 23, 24, 25,],
            vec![31, 32, 33, 34, 35,],
            vec![41, 42, 43, 44, 45,],
            vec![51, 52, 53, 54, 55,],
            vec![61, 62, 63, 64, 65,],
            vec![71, 72, 73, 74, 75,],
        ];
        let compressed = compress(&picture, CompSettings {
            big_square_size: 4,
            small_square_size: 2,
            grouping_factor: 1,
        });
        let restored = decompress(&compressed, DecompSettings { iterations: 10 });
        assert_eq!(restored.len(), 7);
        assert_eq!(restored[0].len(), 5);
    }

    fn print_image(im: Vec<Vec<u8>>) -> String {
        im.iter()
            .map(|ln| format!("{:?}", ln))
            .collect::<Vec<_>>()
            .join("\n")
    }

    #[test]
    fn restores_gradient_image_exactly_to_original_after_10_iterations() {
        let picture = vec![
            vec![11, 12, 13, 14],
            vec![21, 22, 23, 24],
            vec![31, 32, 33, 34],
            vec![41, 42, 43, 44],
        ];
        let compressed = compress(&picture, CompSettings {
            big_square_size: 4,
            small_square_size: 2,
            grouping_factor: 1,
        });
        let restored = decompress(&compressed, DecompSettings { iterations: 10 });
        let dist = picture.dist(&restored);
        assert!(dist == 0, "dist was not 0: \n{}", print_image(restored));
    }
}
