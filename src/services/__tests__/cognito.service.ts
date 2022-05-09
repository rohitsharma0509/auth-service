import Cognito, { GetAccessTokenResponse, SingInResponse, SingUpResponse, VerifyChallengeResponse } from '../cognito.service';
import * as AWSMock from "aws-sdk-mock";
import { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
import path from 'path';
import { assert } from 'console';

beforeAll(async (done) => {
  //get requires env vars
  done()
 });

describe('Test cognito operations', () => {
    let instance: Cognito;

    beforeEach(() => {
        AWSMock.setSDK(path.resolve('./node_modules/aws-sdk'));
        
          AWSMock.mock('CognitoIdentityServiceProvider', 'adminConfirmSignUp', (params: CognitoIdentityServiceProvider.Types.AdminConfirmSignUpRequest, callback: Function) => {
            callback(null, {UserSub: "some_mock_value_id"});
          })
        instance = new Cognito();
    });

    it('should receive success for signUp', async () => {
        AWSMock.mock('CognitoIdentityServiceProvider', 'signUp', (params: CognitoIdentityServiceProvider.Types.SignUpRequest, callback: Function) => {
            callback(null, {UserSub: "some_mock_value_id"});
          })

        const response:SingUpResponse = await instance.signUpUser("+91123456789");
        expect(response.userId).toBe('some_mock_value_id')
        AWSMock.restore('CognitoIdentityServiceProvider');
    });

    it('should receive success for singin', async () => {
        //mocks
        AWSMock.mock('CognitoIdentityServiceProvider', 'initiateAuth', (params: CognitoIdentityServiceProvider.Types.InitiateAuthRequest, callback: Function) => {
            callback(null, {ChallengeParameters:{USER_ID_FOR_SRP: "some_mock_value_id"}, Session: "session_token"});
          })
        const response:SingInResponse = await instance.signInUser("+91123456789");
        expect(response.userId).toBe('some_mock_value_id')
        expect(response.session).toBe('session_token')
        AWSMock.restore('CognitoIdentityServiceProvider');
    });

    it('should receive success for verifyChallenge', async () => {
        //mocks
        AWSMock.mock('CognitoIdentityServiceProvider', 'adminRespondToAuthChallenge', (params: CognitoIdentityServiceProvider.Types.AdminRespondToAuthChallengeRequest, callback: Function) => {
            callback(null, {AuthenticationResult:{
                "AccessToken": "eyJraWQiOiJRU1pYQkhLWjRDWHNoTnNjdEpkYlFBaFh1MVhsR0I2eU9nYlI0ZXRFZTJvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJldmVudF9pZCI6IjgxNmRmOTdlLWNiY2YtNDQzNi1hZDIzLWVmM2Y2NDczYTNmYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJleHAiOjE2MjE2MTQxNTgsImlhdCI6MTYyMTUyNzc1OCwianRpIjoiMGVmODM2ZjMtM2E1Mi00YTY0LWE5NmYtZjhmMDQ2NTFhNWZiIiwiY2xpZW50X2lkIjoiNTdvMDA1dW85aDdwOTlpYmYyaGhraDdscmUiLCJ1c2VybmFtZSI6IjJmOWVhOGU3LTJlNjYtNDk4MC1iYTQ4LWFhMGY4OGVhOTE4MyJ9.gs2vy1c-Cnq0WJmMcNZXtuV6yuFpAqouXT_9uK-_UTuSHbxJvEOHGPbhiYyw7bsK0RXXYqAtgQnb__gvjiGdOci-EMk5dHoaC2A3YspjPL2xvJFbi6z8eFpuxvvqiNumOPhhdNTpWRDMLvYOOvZEiOzH4n6P0hHCnzF3vEw6DdWcotHV_OqysvXa1mKG8G8AjHdNJkc5uk6YjOasY9Xq13Uhd3T8uO_6pWlZtQ2Rnxf0dHt88fXLItGAkTobBRELGmCAFBvjV8If44t0c61tQlsAiel8bHbmpOQ1UZq3DOXqUZqL0byLvcAgrwStdcLOZGRxphvNPRqTMn4pnPltcw",
                "IdToken": "eyJraWQiOiJpQms4OW9lZVA4R3BkejZ4QTBieGd5cGdXWGdmdWhiSUxDam9YcmNvMUhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJhdWQiOiI1N28wMDV1bzloN3A5OWliZjJoaGtoN2xyZSIsImV2ZW50X2lkIjoiODE2ZGY5N2UtY2JjZi00NDM2LWFkMjMtZWYzZjY0NzNhM2ZjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJjb2duaXRvOnVzZXJuYW1lIjoiMmY5ZWE4ZTctMmU2Ni00OTgwLWJhNDgtYWEwZjg4ZWE5MTgzIiwicGhvbmVfbnVtYmVyIjoiKzkxOTc3MjkxMDMwMiIsImN1c3RvbTpTZWNyZXQiOiIyZTExZDllZmJkNDlkM2U3IiwiZXhwIjoxNjIxNjE0MTU4LCJpYXQiOjE2MjE1Mjc3NTh9.iu_Ij_smki2Aj0dVdR9HGD2P3AR4twrZLYRoErHl5-PxMCJOONG0cYasORD_8OMsxnHKFv1mphns9qgMmraKqtdO5XZZxNMaYjuI5a9QpJJYm4tSyGiDLLJUMhucd5NbG5r76Ci979TWyCcsgM1fFnAf65nYcmZrD8NPnc03WcidI8KPWRUfKippt5mPtHa89nU9tQJUl0vs3g9iPFbgSqhnptul_Wui6bwabAi36eShvXJA-JlPBeJGeJKWC80LXwMhTQpO5oVsjaw33xtTVu13uxbFxQU7lAnQL-m0mzevel-3vQaKfrg_MANlh8p3sWyjgtl-Z6leazGZbQxfUg",
                "ExpiresIn": 86400,
                "RefreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WCrYFqrQxo7jR7D2hBnvJOZGuMepfHvrd1MBZTTBqm80uexuCF7iVQZjTfll_dLWQcr2UXGnvIAQehQs5J84bWhBEb9jBoIiDIWHVO53ciAWx4Hv92Ubg_VSGK9BMcSXxzITKijEGr2rVUo1A1Y9bVdZhF1UksWt2vIego-s2aNB2L2fKV1k_9gPOh0xWPH0OBiu_wZx4eEsY4GPNDH_d-pD19ISHI2us64u3xRHS1YDm6U0T-LpksNqsBbbrbVgov_tKVm0txPcmYun7tE1cDqBuQu0k5nwGdtt91_BEI3Bwq0COcobXoNihKWQRSB7VBhoELWLCigZloT0rEPopQ.1msCcFLL3NJrqK67.2lypXZcB9WxMYX5RnizCHXlP-EMHNEZQZdrZ2aLX17atoxRRfiZwEpyso5fzOGdZNEcj-V2qRsDTQdQuXCmWLKUIPC9COlYK2IQJri_DoLJEIS8etSKcmXVA7rq21EQpE4isrYagrA4jv_PFd3GJfc8HPw6AYF5lF6QtByq7824_IKKR2gLnNKZwsf61uq5PMs4s_lE6senuHcvy0VuOIEt67vmKKwdUg6LM3KOvdW1bofWVySDe3lMtF5j2kgdiGzmKsPqwVGX6q8Nd5cEbvGs1BvIM_hmqPiCx-PPSHJU8YQPl7vnePYxZMKhxa_fnuud1A4Lvv3bcSoAyX2UqCQl00j8Nit2PJn3wz-fyJ25lyq4y_qYLnaJkAM-CEowNsTcwcI-VbkkcDH5FuEI3QuYZNyZOIxvi9SU6PZEeyNF27aLH8v2_iRinQSYkaUw9BDF9_arjb_iBCmPFyOGhK6_7iqt5SuH7yFGHI4Zm9MVzH8ja4s0k8ZGhBvbcJIwxY6sSzLb57oV644K3I3yHy5ASwCcZUD-8yAcXbAnMRNM4Zz90AFHQIZtPMA5dT3OYf9uHKO8RegsVTCMHM9i1KWtOBzdGkbzEmsJrZQyLgnYMvNnBjXKkmiQzvmUqnPgrkjNdNi6eQ6Vd9U6jfynZFjHj1pYLEi-Vhp_LhDpUeKNEMRf_WBgYMCz433bjXpApSC42fuz6G5paqrUt274ftFpVQ5pSQHkwpqjVhBgluVDwbPmFRlialILgEORTozIJRcHEuF68DYnTqBWwSrMczo5iVNO4WlCoqOU76Vtnc63VP7VH_WtqSB58zVicJzMSo2cGM3WS9Gy7TntdoVFIqhF-Y3Hd3ryJE5Obcm91csDUHSsoSgUItIy2xZJbnQ0F4kGTOgHpfNHPZaTMWZj_1zqdvt_kFOB7wG9NYuOFqGt9YBDfFG8pYJYg5CFyfi85H-P1WuUKfp5cvMHX65ZCTxbvnlv3EuxzCHCwhWF4C3Vjaag9UVhM5ee2Ls2fiIAe27HNGOmyUarg-6RShzdfgPpjyVsPuTuEgnK3NffAeDrk9WN-phl3hI1bY7zR2mw327f-08MDen7vvfnb0cGSLBQfUUZ2ZvL_pUzOjxtFsJGIlxkFTSpy6bTjrpN-c9cAILNlMu0CosloXdnu7jt4RL-0PhLJ7YHKwx1rorimM2LuXHIK-OalD5yJho53a7WWQ9sv7-cD-DLbz4aE_WR3DpfYwbGJWeIdX2r_pLqQv_aHljQ2uQD6Zp5_7yMmCGRLs8-IZ0ENZ1Z4Z8c7GQ9B9X-c60c0e3UK94zeLj7dUaM0NqdKv3mJwq-hDUwl9vZIyqhI69IIAePStQwetQ.1SSrsAoU2iDGOJlwh0mzlw"
            }});
          })
        const response:VerifyChallengeResponse = await instance.verifyChallenge("user_id", "123456", "session_token" );
        expect(response.AccessToken).toBe("eyJraWQiOiJRU1pYQkhLWjRDWHNoTnNjdEpkYlFBaFh1MVhsR0I2eU9nYlI0ZXRFZTJvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJldmVudF9pZCI6IjgxNmRmOTdlLWNiY2YtNDQzNi1hZDIzLWVmM2Y2NDczYTNmYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJleHAiOjE2MjE2MTQxNTgsImlhdCI6MTYyMTUyNzc1OCwianRpIjoiMGVmODM2ZjMtM2E1Mi00YTY0LWE5NmYtZjhmMDQ2NTFhNWZiIiwiY2xpZW50X2lkIjoiNTdvMDA1dW85aDdwOTlpYmYyaGhraDdscmUiLCJ1c2VybmFtZSI6IjJmOWVhOGU3LTJlNjYtNDk4MC1iYTQ4LWFhMGY4OGVhOTE4MyJ9.gs2vy1c-Cnq0WJmMcNZXtuV6yuFpAqouXT_9uK-_UTuSHbxJvEOHGPbhiYyw7bsK0RXXYqAtgQnb__gvjiGdOci-EMk5dHoaC2A3YspjPL2xvJFbi6z8eFpuxvvqiNumOPhhdNTpWRDMLvYOOvZEiOzH4n6P0hHCnzF3vEw6DdWcotHV_OqysvXa1mKG8G8AjHdNJkc5uk6YjOasY9Xq13Uhd3T8uO_6pWlZtQ2Rnxf0dHt88fXLItGAkTobBRELGmCAFBvjV8If44t0c61tQlsAiel8bHbmpOQ1UZq3DOXqUZqL0byLvcAgrwStdcLOZGRxphvNPRqTMn4pnPltcw")
        expect(response.IdToken).toBe('eyJraWQiOiJpQms4OW9lZVA4R3BkejZ4QTBieGd5cGdXWGdmdWhiSUxDam9YcmNvMUhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJhdWQiOiI1N28wMDV1bzloN3A5OWliZjJoaGtoN2xyZSIsImV2ZW50X2lkIjoiODE2ZGY5N2UtY2JjZi00NDM2LWFkMjMtZWYzZjY0NzNhM2ZjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJjb2duaXRvOnVzZXJuYW1lIjoiMmY5ZWE4ZTctMmU2Ni00OTgwLWJhNDgtYWEwZjg4ZWE5MTgzIiwicGhvbmVfbnVtYmVyIjoiKzkxOTc3MjkxMDMwMiIsImN1c3RvbTpTZWNyZXQiOiIyZTExZDllZmJkNDlkM2U3IiwiZXhwIjoxNjIxNjE0MTU4LCJpYXQiOjE2MjE1Mjc3NTh9.iu_Ij_smki2Aj0dVdR9HGD2P3AR4twrZLYRoErHl5-PxMCJOONG0cYasORD_8OMsxnHKFv1mphns9qgMmraKqtdO5XZZxNMaYjuI5a9QpJJYm4tSyGiDLLJUMhucd5NbG5r76Ci979TWyCcsgM1fFnAf65nYcmZrD8NPnc03WcidI8KPWRUfKippt5mPtHa89nU9tQJUl0vs3g9iPFbgSqhnptul_Wui6bwabAi36eShvXJA-JlPBeJGeJKWC80LXwMhTQpO5oVsjaw33xtTVu13uxbFxQU7lAnQL-m0mzevel-3vQaKfrg_MANlh8p3sWyjgtl-Z6leazGZbQxfUg')
        expect(response.RefreshToken).toBe('eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WCrYFqrQxo7jR7D2hBnvJOZGuMepfHvrd1MBZTTBqm80uexuCF7iVQZjTfll_dLWQcr2UXGnvIAQehQs5J84bWhBEb9jBoIiDIWHVO53ciAWx4Hv92Ubg_VSGK9BMcSXxzITKijEGr2rVUo1A1Y9bVdZhF1UksWt2vIego-s2aNB2L2fKV1k_9gPOh0xWPH0OBiu_wZx4eEsY4GPNDH_d-pD19ISHI2us64u3xRHS1YDm6U0T-LpksNqsBbbrbVgov_tKVm0txPcmYun7tE1cDqBuQu0k5nwGdtt91_BEI3Bwq0COcobXoNihKWQRSB7VBhoELWLCigZloT0rEPopQ.1msCcFLL3NJrqK67.2lypXZcB9WxMYX5RnizCHXlP-EMHNEZQZdrZ2aLX17atoxRRfiZwEpyso5fzOGdZNEcj-V2qRsDTQdQuXCmWLKUIPC9COlYK2IQJri_DoLJEIS8etSKcmXVA7rq21EQpE4isrYagrA4jv_PFd3GJfc8HPw6AYF5lF6QtByq7824_IKKR2gLnNKZwsf61uq5PMs4s_lE6senuHcvy0VuOIEt67vmKKwdUg6LM3KOvdW1bofWVySDe3lMtF5j2kgdiGzmKsPqwVGX6q8Nd5cEbvGs1BvIM_hmqPiCx-PPSHJU8YQPl7vnePYxZMKhxa_fnuud1A4Lvv3bcSoAyX2UqCQl00j8Nit2PJn3wz-fyJ25lyq4y_qYLnaJkAM-CEowNsTcwcI-VbkkcDH5FuEI3QuYZNyZOIxvi9SU6PZEeyNF27aLH8v2_iRinQSYkaUw9BDF9_arjb_iBCmPFyOGhK6_7iqt5SuH7yFGHI4Zm9MVzH8ja4s0k8ZGhBvbcJIwxY6sSzLb57oV644K3I3yHy5ASwCcZUD-8yAcXbAnMRNM4Zz90AFHQIZtPMA5dT3OYf9uHKO8RegsVTCMHM9i1KWtOBzdGkbzEmsJrZQyLgnYMvNnBjXKkmiQzvmUqnPgrkjNdNi6eQ6Vd9U6jfynZFjHj1pYLEi-Vhp_LhDpUeKNEMRf_WBgYMCz433bjXpApSC42fuz6G5paqrUt274ftFpVQ5pSQHkwpqjVhBgluVDwbPmFRlialILgEORTozIJRcHEuF68DYnTqBWwSrMczo5iVNO4WlCoqOU76Vtnc63VP7VH_WtqSB58zVicJzMSo2cGM3WS9Gy7TntdoVFIqhF-Y3Hd3ryJE5Obcm91csDUHSsoSgUItIy2xZJbnQ0F4kGTOgHpfNHPZaTMWZj_1zqdvt_kFOB7wG9NYuOFqGt9YBDfFG8pYJYg5CFyfi85H-P1WuUKfp5cvMHX65ZCTxbvnlv3EuxzCHCwhWF4C3Vjaag9UVhM5ee2Ls2fiIAe27HNGOmyUarg-6RShzdfgPpjyVsPuTuEgnK3NffAeDrk9WN-phl3hI1bY7zR2mw327f-08MDen7vvfnb0cGSLBQfUUZ2ZvL_pUzOjxtFsJGIlxkFTSpy6bTjrpN-c9cAILNlMu0CosloXdnu7jt4RL-0PhLJ7YHKwx1rorimM2LuXHIK-OalD5yJho53a7WWQ9sv7-cD-DLbz4aE_WR3DpfYwbGJWeIdX2r_pLqQv_aHljQ2uQD6Zp5_7yMmCGRLs8-IZ0ENZ1Z4Z8c7GQ9B9X-c60c0e3UK94zeLj7dUaM0NqdKv3mJwq-hDUwl9vZIyqhI69IIAePStQwetQ.1SSrsAoU2iDGOJlwh0mzlw')
        expect(response.ExpiresIn).toBe(86400)
        expect(response.ExpiresAt).toBe(1621614158)
        AWSMock.restore('CognitoIdentityServiceProvider');
    });

    it('should receive success for getAccessToken', async () => {
        //mocks
        AWSMock.mock('CognitoIdentityServiceProvider', 'initiateAuth', (params: CognitoIdentityServiceProvider.Types.InitiateAuthRequest, callback: Function) => {
            callback(null, {AuthenticationResult:{
                AccessToken: "eyJraWQiOiJRU1pYQkhLWjRDWHNoTnNjdEpkYlFBaFh1MVhsR0I2eU9nYlI0ZXRFZTJvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJldmVudF9pZCI6IjgxNmRmOTdlLWNiY2YtNDQzNi1hZDIzLWVmM2Y2NDczYTNmYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJleHAiOjE2MjE2MTQxNTgsImlhdCI6MTYyMTUyNzc1OCwianRpIjoiMGVmODM2ZjMtM2E1Mi00YTY0LWE5NmYtZjhmMDQ2NTFhNWZiIiwiY2xpZW50X2lkIjoiNTdvMDA1dW85aDdwOTlpYmYyaGhraDdscmUiLCJ1c2VybmFtZSI6IjJmOWVhOGU3LTJlNjYtNDk4MC1iYTQ4LWFhMGY4OGVhOTE4MyJ9.gs2vy1c-Cnq0WJmMcNZXtuV6yuFpAqouXT_9uK-_UTuSHbxJvEOHGPbhiYyw7bsK0RXXYqAtgQnb__gvjiGdOci-EMk5dHoaC2A3YspjPL2xvJFbi6z8eFpuxvvqiNumOPhhdNTpWRDMLvYOOvZEiOzH4n6P0hHCnzF3vEw6DdWcotHV_OqysvXa1mKG8G8AjHdNJkc5uk6YjOasY9Xq13Uhd3T8uO_6pWlZtQ2Rnxf0dHt88fXLItGAkTobBRELGmCAFBvjV8If44t0c61tQlsAiel8bHbmpOQ1UZq3DOXqUZqL0byLvcAgrwStdcLOZGRxphvNPRqTMn4pnPltcw",
                IdToken: "eyJraWQiOiJpQms4OW9lZVA4R3BkejZ4QTBieGd5cGdXWGdmdWhiSUxDam9YcmNvMUhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJhdWQiOiI1N28wMDV1bzloN3A5OWliZjJoaGtoN2xyZSIsImV2ZW50X2lkIjoiODE2ZGY5N2UtY2JjZi00NDM2LWFkMjMtZWYzZjY0NzNhM2ZjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJjb2duaXRvOnVzZXJuYW1lIjoiMmY5ZWE4ZTctMmU2Ni00OTgwLWJhNDgtYWEwZjg4ZWE5MTgzIiwicGhvbmVfbnVtYmVyIjoiKzkxOTc3MjkxMDMwMiIsImN1c3RvbTpTZWNyZXQiOiIyZTExZDllZmJkNDlkM2U3IiwiZXhwIjoxNjIxNjE0MTU4LCJpYXQiOjE2MjE1Mjc3NTh9.iu_Ij_smki2Aj0dVdR9HGD2P3AR4twrZLYRoErHl5-PxMCJOONG0cYasORD_8OMsxnHKFv1mphns9qgMmraKqtdO5XZZxNMaYjuI5a9QpJJYm4tSyGiDLLJUMhucd5NbG5r76Ci979TWyCcsgM1fFnAf65nYcmZrD8NPnc03WcidI8KPWRUfKippt5mPtHa89nU9tQJUl0vs3g9iPFbgSqhnptul_Wui6bwabAi36eShvXJA-JlPBeJGeJKWC80LXwMhTQpO5oVsjaw33xtTVu13uxbFxQU7lAnQL-m0mzevel-3vQaKfrg_MANlh8p3sWyjgtl-Z6leazGZbQxfUg",
                ExpiresIn: 86400
                }});
          })
        const response:GetAccessTokenResponse = await instance.getAccessToken( "refresh_token" );
        expect(response.AccessToken).toBe("eyJraWQiOiJRU1pYQkhLWjRDWHNoTnNjdEpkYlFBaFh1MVhsR0I2eU9nYlI0ZXRFZTJvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJldmVudF9pZCI6IjgxNmRmOTdlLWNiY2YtNDQzNi1hZDIzLWVmM2Y2NDczYTNmYyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJleHAiOjE2MjE2MTQxNTgsImlhdCI6MTYyMTUyNzc1OCwianRpIjoiMGVmODM2ZjMtM2E1Mi00YTY0LWE5NmYtZjhmMDQ2NTFhNWZiIiwiY2xpZW50X2lkIjoiNTdvMDA1dW85aDdwOTlpYmYyaGhraDdscmUiLCJ1c2VybmFtZSI6IjJmOWVhOGU3LTJlNjYtNDk4MC1iYTQ4LWFhMGY4OGVhOTE4MyJ9.gs2vy1c-Cnq0WJmMcNZXtuV6yuFpAqouXT_9uK-_UTuSHbxJvEOHGPbhiYyw7bsK0RXXYqAtgQnb__gvjiGdOci-EMk5dHoaC2A3YspjPL2xvJFbi6z8eFpuxvvqiNumOPhhdNTpWRDMLvYOOvZEiOzH4n6P0hHCnzF3vEw6DdWcotHV_OqysvXa1mKG8G8AjHdNJkc5uk6YjOasY9Xq13Uhd3T8uO_6pWlZtQ2Rnxf0dHt88fXLItGAkTobBRELGmCAFBvjV8If44t0c61tQlsAiel8bHbmpOQ1UZq3DOXqUZqL0byLvcAgrwStdcLOZGRxphvNPRqTMn4pnPltcw")
        expect(response.IdToken).toBe('eyJraWQiOiJpQms4OW9lZVA4R3BkejZ4QTBieGd5cGdXWGdmdWhiSUxDam9YcmNvMUhFPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIyZjllYThlNy0yZTY2LTQ5ODAtYmE0OC1hYTBmODhlYTkxODMiLCJhdWQiOiI1N28wMDV1bzloN3A5OWliZjJoaGtoN2xyZSIsImV2ZW50X2lkIjoiODE2ZGY5N2UtY2JjZi00NDM2LWFkMjMtZWYzZjY0NzNhM2ZjIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MjE1Mjc3NTgsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV9ITERXTFVEa20iLCJjb2duaXRvOnVzZXJuYW1lIjoiMmY5ZWE4ZTctMmU2Ni00OTgwLWJhNDgtYWEwZjg4ZWE5MTgzIiwicGhvbmVfbnVtYmVyIjoiKzkxOTc3MjkxMDMwMiIsImN1c3RvbTpTZWNyZXQiOiIyZTExZDllZmJkNDlkM2U3IiwiZXhwIjoxNjIxNjE0MTU4LCJpYXQiOjE2MjE1Mjc3NTh9.iu_Ij_smki2Aj0dVdR9HGD2P3AR4twrZLYRoErHl5-PxMCJOONG0cYasORD_8OMsxnHKFv1mphns9qgMmraKqtdO5XZZxNMaYjuI5a9QpJJYm4tSyGiDLLJUMhucd5NbG5r76Ci979TWyCcsgM1fFnAf65nYcmZrD8NPnc03WcidI8KPWRUfKippt5mPtHa89nU9tQJUl0vs3g9iPFbgSqhnptul_Wui6bwabAi36eShvXJA-JlPBeJGeJKWC80LXwMhTQpO5oVsjaw33xtTVu13uxbFxQU7lAnQL-m0mzevel-3vQaKfrg_MANlh8p3sWyjgtl-Z6leazGZbQxfUg')
        expect(response.ExpiresIn).toBe(86400)
        expect(response.ExpiresAt).toBe(1621614158)
        AWSMock.restore('CognitoIdentityServiceProvider');
    });

    it('should receive success for logout', async () => {
        //mocks
        AWSMock.mock('CognitoIdentityServiceProvider', 'globalSignOut', (params: CognitoIdentityServiceProvider.Types.GlobalSignOutRequest, callback: Function) => {
            callback(null, {});
          })
        const response:boolean = await instance.logout( "access_token" );
        expect(response).toBe(true)
        AWSMock.restore('CognitoIdentityServiceProvider');

    });
    it('should receive error for signUp', async () => {
      let awsError:AWSError ={code:'error_code', name: 'error name', message: 'error_message', 
      time: new Date(), retryable: false, statusCode:400, hostname: 'local', region: 'test', retryDelay:10, requestId: 'requestId', 
      extendedRequestId: 'extendedRequestId', cfId: 'id'}

      //@ts-ignore
      AWSMock.mock('CognitoIdentityServiceProvider', 'signUp', (params: CognitoIdentityServiceProvider.Types.SignUpRequest, callback: (err: AWSError, data: CognitoIdentityServiceProvider.Types.AdminConfirmSignUpResponse) => void) => {
        callback(awsError , null); 
      })
        try{
          await instance.signUpUser("+91123456789");
        }catch(error){
          expect(error.code).toBe('error_code')
          expect(error.name).toBe('error name')
          expect(error.message).toBe('error_message')
        }
        AWSMock.restore('CognitoIdentityServiceProvider');
    });
});

// describe('Test cognito operations with errors', () => {
//   let instance: Cognito;

//   beforeEach(() => {
//       AWSMock.setSDK(path.resolve('./node_modules/aws-sdk'));
//       instance = new Cognito();
//   });




// })
