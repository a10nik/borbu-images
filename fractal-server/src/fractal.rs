use byte_rect::*;

static transforms: &'static [Transform] = &[
    Transform::HeadToTop, Transform::HeadToRight, Transform::HeadToBottom, Transform::HeadToLeft,
    Transform::HeadToTopInv, Transform::HeadToRightInv, Transform::HeadToBottomInv, Transform::HeadToLeftInv,
];

pub fn find_closest_square<'a, R>(squares: &'a Vec<R>, desired: &'a R) -> (usize, Transform, LinearCoeffs) where R: ByteRect {
    let (best_i, best_transform, best_coeffs, _) = squares.iter()
        .enumerate()
        .flat_map(|(i, sq)| transforms.iter().map(move |&t| (i, t, sq.transform(t))))
        .map(|(i, t, sq)| (i, t, sq.best_coeffs_to_match(desired), sq))
        .min_by_key(|&(_, _, _, ref sq)| desired.dist(&sq.linear(sq.best_coeffs_to_match(desired))))
        .unwrap();
    (best_i, best_transform, best_coeffs)
}

#[cfg(test)]
mod tests {
    use fractal::*;
    use byte_rect::*;

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
}
