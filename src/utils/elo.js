
const K_FACTOR = 32

/**
 * ELO Rating Calculator
 */
function calculateElo(winnerRating, loserRating) {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400))

    const newWinnerRating = Math.round(winnerRating + K_FACTOR * (1 - expectedWinner))
    const newLoserRating = Math.round(loserRating + K_FACTOR * (0 - expectedLoser))

    return { newWinnerRating, newLoserRating }
}

module.exports = { calculateElo }
