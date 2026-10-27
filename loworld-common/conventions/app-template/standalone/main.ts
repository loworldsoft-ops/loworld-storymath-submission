// 단독 실행의 진입점이다. 모든 앱 저장소에서 글자까지 같다. 고치지 않는다.
// 로그인 화면 다음에 이 앱이 전체 화면으로 뜬다. 고객에게 파는 것이 이 빌드다.
import { bootstrapLwApp } from '@loworld/common/host';
import { manifest } from '../src/manifest';
import { environment } from './environment';

void bootstrapLwApp(environment, manifest);
