package com.loworld.nativeapp

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * 합성 단계 수 고르기. 합성이 재생을 따라가지 못하면 문장 사이가 비므로, 빠르게 읽거나 폰이 느려지면 단계를 내린다.
 * 숫자는 갤럭시 Z 폴드6에서 잰 단계당 속도(식을 때 0.066, 뜨거울 때 0.092)다.
 */
class ChooseStepsTest {
    @Test
    fun `보통 빠르기에서는 가장 높은 단계`() {
        assertEquals(5, chooseSteps(0.066f, 1f))
        assertEquals(5, chooseSteps(0.092f, 1f))
    }

    @Test
    fun `2배로 재생하면 단계를 내린다`() {
        assertEquals(4, chooseSteps(0.085f, 2f))
    }

    @Test
    fun `아주 느린 폰에서도 3 아래로는 내리지 않는다`() {
        assertEquals(3, chooseSteps(0.5f, 2f))
    }

    @Test
    fun `잰 값이 없으면 가장 높은 단계`() {
        assertEquals(5, chooseSteps(0f, 1f))
    }
}
