import jwtDecode from "jwt-decode";
import router from "@/router";
import { login, findById, tokenRegeneration, logout } from "@/axios/user";

const userStore = {
    namespaced: true,
    state: {
        isLogin: false,
        isLoginError: false,
        userInfo: null,
        isValidToken: false,
    },
    getters: {
        checkUserInfo: function (state) {
            return state.userInfo;
        },
        checkToken: function (state) {
            return state.isValidToken;
        },
    },
    mutations: {
        SET_IS_LOGIN: (state, isLogin) => {
            state.isLogin = isLogin;
        },
        SET_IS_LOGIN_ERROR: (state, isLoginError) => {
            state.isLoginError = isLoginError;
        },
        SET_IS_VALID_TOKEN: (state, isValidToken) => {
            state.isValidToken = isValidToken;
        },
        SET_USER_INFO: (state, userInfo) => {
            state.isLogin = true;
            state.userInfo = userInfo;
        },
    },
    actions: {
        async userConfirm({ commit }, user) {
            await login(
                user,
                ({ data }) => {
                    console.log("userConfirm");

                    // 정상적으로 로그인 됐다면
                    if (data.message === "success") {
                        let accessToken = data["access-token"];
                        let refreshToken = data["refresh-token"];
                        // console.log("login success token created!!!! >> ", accessToken, refreshToken);
                        commit("SET_IS_LOGIN", true);
                        commit("SET_IS_LOGIN_ERROR", false);
                        commit("SET_IS_VALID_TOKEN", true);
                        sessionStorage.setItem("access-token", accessToken);
                        sessionStorage.setItem("refresh-token", refreshToken);
                    } else {
                        commit("SET_IS_LOGIN", false);
                        commit("SET_IS_LOGIN_ERROR", true);
                        commit("SET_IS_VALID_TOKEN", false);
                    }
                },
                (error) => {
                    console.log(error);
                }
            );
        },
        async getUserInfo({ commit, dispatch }, token) {
            let decodeToken = jwtDecode(token);
            // console.log("2. getUserInfo() decodeToken :: ", decodeToken);
            await findById( // token의 유효성 검증
                decodeToken.userid,
                ({ data }) => {
                    if (data.message === "success") {
                        commit("SET_USER_INFO", data.userInfo);
                        console.log("3. getUserInfo data >> ", data);
                    } else {
                        console.log("유저 정보 없음!!!!");
                    }
                },
                async (error) => { // 사용 불가능 토큰일 경우 서버에서 HttpStatus.UNAUTHORIZE(401) 전달
                    console.log("getUserInfo() error code [토큰 만료되어 사용 불가능.] ::: ", error.response.status);
                    commit("SET_IS_VALID_TOKEN", false);
                    await dispatch("tokenRegeneration"); // access token 재발급
                }
            );
        },
        async tokenRegeneration({ commit, state }) {
            console.log("토큰 재발급 >> 기존 토큰 정보 : {}", sessionStorage.getItem("access-token"));
            await tokenRegeneration( // 서버로 access token 재발급 요청
                JSON.stringify(state.userInfo),
                ({ data }) => {
                    if (data.message === "success") {
                        let accessToken = data["access-token"];
                        console.log("재발급 완료 >> 새로운 토큰 : {}", accessToken);
                        sessionStorage.setItem("access-token", accessToken);
                        commit("SET_IS_VALID_TOKEN", true);
                    }
                },
                async (error) => { // 401 에러 응답이 온 경우 refresh token의 유효기간이 만료된 것. 다시 로그인
                    // HttpStatus.UNAUTHORIZE(401) : RefreshToken 기간 만료 >> 다시 로그인!!!!
                    if (error.response.status === 401) {
                        console.log("갱신 실패");
                        // 다시 로그인 전 DB에 저장된 RefreshToken 제거.
                        await logout(
                            state.userInfo.userid,
                            ({ data }) => {
                                if (data.message === "success") {
                                    console.log("리프레시 토큰 제거 성공");
                                } else {
                                    console.log("리프레시 토큰 제거 실패");
                                }
                                alert("RefreshToken 기간 만료!!! 다시 로그인해 주세요.");
                                commit("SET_IS_LOGIN", false);
                                commit("SET_USER_INFO", null);
                                commit("SET_IS_VALID_TOKEN", false);
                                router.push({ name: "login" });
                            },
                            (error) => {
                                console.log(error);
                                commit("SET_IS_LOGIN", false);
                                commit("SET_USER_INFO", null);
                            }
                        );
                    }
                }
            );
        },
        async userLogout({ commit }, userid) {
            await logout(
                userid,
                ({ data }) => {
                    if (data.message === "success") {
                        commit("SET_IS_LOGIN", false);
                        commit("SET_USER_INFO", null);
                        commit("SET_IS_VALID_TOKEN", false);
                    } else {
                        console.log("유저 정보 없음!!!!");
                    }
                },
                (error) => {
                    console.log(error);
                }
            );
        },
    },
};

export default userStore;