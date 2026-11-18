package com.loworld.nativeapp

/** 웹 앱을 어디서 불러오는가. 이름은 계약(`bridge.schema.json`)의 값과 같다. */
enum class ExecutionMode {
    /** 웹에 배포한 것을 연다. */
    REMOTE_WEB,

    /** 앱에 넣어 둔 묶음을 연다. */
    LOCAL_ASSET,
}
