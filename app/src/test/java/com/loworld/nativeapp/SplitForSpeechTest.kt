package com.loworld.nativeapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** 낭독할 글을 문장으로 나누는 규칙. 첫 소리를 빨리 내려고 문장마다 합성하므로, 나누기가 틀리면 말이 끊기거나 빠진다. */
class SplitForSpeechTest {
    @Test
    fun `문장 끝에서 나눈다`() {
        assertEquals(
            listOf("소운은 검을 들어 마철을 보았다.", "마철이 크게 웃으며 물러섰다!", "너는 대체 누구란 말이냐?"),
            splitForSpeech("소운은 검을 들어 마철을 보았다. 마철이 크게 웃으며 물러섰다! 너는 대체 누구란 말이냐?"),
        )
    }

    @Test
    fun `줄바꿈에서 나누고 빈 줄은 버린다`() {
        assertEquals(
            listOf("첫 줄은 이렇게 끝이 난다", "둘째 줄은 여기서 시작된다"),
            splitForSpeech("첫 줄은 이렇게 끝이 난다\n\n  \n둘째 줄은 여기서 시작된다"),
        )
    }

    @Test
    fun `아주 짧은 조각은 다음 것과 붙인다`() {
        assertEquals(listOf("아. 소운은 검을 들었다."), splitForSpeech("아. 소운은 검을 들었다."))
    }

    @Test
    fun `긴 문장은 120자 안에서 자르고 글자를 잃지 않는다`() {
        val long = (1..40).joinToString(" ") { "낱말$it" } + "."
        val pieces = splitForSpeech(long)
        assertTrue(pieces.size > 1)
        assertTrue(pieces.all { it.length <= 120 })
        assertEquals(long.replace(" ", ""), pieces.joinToString("").replace(" ", ""))
    }

    @Test
    fun `띄어쓰기가 없는 긴 글도 자른다`() {
        val long = "가".repeat(300)
        val pieces = splitForSpeech(long)
        assertTrue(pieces.all { it.length <= 120 })
        assertEquals(long, pieces.joinToString(""))
    }

    @Test
    fun `빈 글은 빈 목록`() {
        assertEquals(emptyList<String>(), splitForSpeech("   \n "))
    }
}
