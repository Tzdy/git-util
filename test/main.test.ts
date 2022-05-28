import { add, mul } from '@/lib'

test('1 + 2 = 3', () => {
    expect(add(1, 2)).toBe(3)
})

test('1 * 2 = 2', () => {
    expect(mul(1, 2)).toBe(2)
})

