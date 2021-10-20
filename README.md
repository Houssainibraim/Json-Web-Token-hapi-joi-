# Json-Web-Token-hapi-joi-
Creating a rest api using json web token and @hapi/joi validation 
## Introduction

Tokens encapsulate signed statements called claims. A claim is a named JSON
value. Applications using JWTs should define which specific claims they use and
when they are required or optional.

```go
var claims jwt.Claims
claims.Subject = "alice"
claims.Issued  = jwt.NewNumericTime(time.Now().Round(time.Second))
claims.Set     = map[string]interface{}{"email_verified": false}
// issue a JWT
token, err := claims.EdDSASign(JWTPrivateKey)
```

Tokens consists of printable ASCII characters, e.g.,
`eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJha3JpZWdlciIsInByZWZpeCI6IkRyLiJ9.RTOboYsLW7zXFJyXtIypOmXfuRGVT_FpDUTs2TOuK73qZKm56JcESfsl_etnBsl7W80TXE5l5qecrMizh3XYmw`.
Secured resources can use such tokens to determine the respective permissions.
Note how the verification process is self-contained with just a public key.

```go
// verify a JWT
claims, err := jwt.EdDSACheck(token, JWTPublicKey)
if err != nil {
	log.Print("credentials denied with ", err)
	return
}
if !claims.Valid(time.Now()) {
	log.Print("credential time constraints exceeded")
	return
}
log.Print("hello ", claims.Subject)
if verified, _ := claims.Set["email_verified"].(bool); !verified {
	log.Print("e-mail confirmation pending")
}
```

Commonly, agents receive a JWT uppon authentication/login. Then, that token is
included with requests to the secured resources, as a proof of authority. Token
access is “eyes only” in such scenario. Include and enforce more context detail
with claims to further reduce risk. E.g., a session identifier or a fingerprint
of the client's TLS key can prevent usage of any hijacked tokens.


## High-Level API

Server-side security can be applied with a standard `http.Handler` setup.
The following example denies requests to `MyAPI` when the JWT is not valid,
or when the JWT is missing either the subject, formatted name or roles claim.

```go
// define trusted credentials
var keys jwt.KeyRegister
n, err := keys.LoadPEM(text, nil)
if err != nil {
	log.Fatal(err)
}
log.Print("setup with ", n, " JWT keys")
http.Handle("/api/v1", &jwt.Handler{
	Target: MyAPI, // protected HTTP handler
	Keys:   &keys,
	// map two claims to HTTP headers
	HeaderPrefix: "X-Verified-",
	HeaderBinding: map[string]string{
		"sub": "X-Verified-User", // registered [standard] claim
		"fn":  "X-Verified-Name", // private [custom] claim
	},
	// map another claim with custom logic
	Func: func(w http.ResponseWriter, req *http.Request, claims *jwt.Claims) (pass bool) {
		log.Printf("got a valid JWT %q for %q", claims.ID, claims.Audiences)
		// map role enumeration
		s, ok := claims.String("roles")
		if !ok {
			http.Error(w, "jwt: want roles claim as a string", http.StatusForbidden)
			return false
		}
		req.Header["X-Verified-Roles"] = strings.Fields(s)
		return true
	},
})
```

When all applicable JWT claims are mapped to HTTP request headers, then the
service logic can stay free of verification code, plus easier unit testing.

```go
// Greeting is a standard HTTP handler fuction.
func Greeting(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "Hello %s!\n", req.Header.Get("X-Verified-Name"))
	fmt.Fprintf(w, "You are authorized as %s.\n", req.Header.Get("X-Verified-User"))
}
```

The validated [Claims](https://godoc.org/github.com/pascaldekloe/jwt#Claims)
object may also be exposed through the
[request context](https://godoc.org/github.com/pascaldekloe/jwt#example-Handler--Context).

