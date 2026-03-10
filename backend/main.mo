import Text "mo:core/Text";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Timer "mo:core/Timer";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    teamName : ?Text;
  };

  type Stock = {
    name : Text;
    var price : Float;
    priceHistory : List.List<Float>;
  };

  public type StockView = {
    name : Text;
    price : Float;
    priceHistory : [Float];
  };

  type Team = {
    name : Text;
    var cash : Float;
    portfolio : Map.Map<Text, Nat>;
    var totalValue : Float;
  };

  public type TeamView = {
    name : Text;
    cash : Float;
    portfolio : [(Text, Nat)];
    totalValue : Float;
  };

  type News = {
    headline : Text;
    description : Text;
    isFlashed : Bool;
  };

  type MarketState = {
    var roundNumber : Nat;
    var isOpen : Bool;
    var marketTimer : ?Timer.TimerId;
  };

  let marketState : MarketState = {
    var roundNumber = 0;
    var isOpen = false;
    var marketTimer = null;
  };

  let stocks = Map.empty<Text, Stock>();
  let teams = Map.empty<Text, Team>();
  let news = Map.empty<Nat, News>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createStock(name : Text, initialPrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create stocks");
    };

    let newStock : Stock = {
      name;
      var price = initialPrice;
      priceHistory = List.empty<Float>();
    };

    newStock.priceHistory.add(initialPrice);
    stocks.add(name, newStock);
  };

  public shared ({ caller }) func updateStockPrice(name : Text, newPrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update stock prices");
    };

    switch (stocks.get(name)) {
      case (null) { Runtime.trap("Stock not found") };
      case (?stock) {
        stock.price := newPrice;
        stock.priceHistory.add(newPrice);
      };
    };
  };

  public shared ({ caller }) func createTeam(name : Text, initialCash : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create teams");
    };

    let newPortfolio = Map.empty<Text, Nat>();
    let team : Team = {
      name;
      var cash = initialCash;
      portfolio = newPortfolio;
      var totalValue = initialCash;
    };

    teams.add(name, team);
  };

  public shared ({ caller }) func updateTeamCash(name : Text, amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update team cash");
    };

    switch (teams.get(name)) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) {
        team.cash := team.cash + amount;
        updateTeamTotalValue(name);
      };
    };
  };

  public shared ({ caller }) func addNews(headline : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add news");
    };

    let id = Int.abs(Time.now());
    let newNews : News = {
      headline;
      description;
      isFlashed = false;
    };

    news.add(id, newNews);
  };

  public shared ({ caller }) func flashNews(newsId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can flash news");
    };

    switch (news.get(newsId)) {
      case (null) { Runtime.trap("News not found") };
      case (?existingNews) {
        let updatedNews = {
          existingNews with
          isFlashed = true;
        };
        news.add(newsId, updatedNews);
      };
    };
  };

  public shared ({ caller }) func startRound() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can start rounds");
    };

    marketState.roundNumber += 1;
    marketState.isOpen := true;
  };

  public shared ({ caller }) func endRound() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can end rounds");
    };

    marketState.isOpen := false;
  };

  public shared ({ caller }) func buyStock(teamName : Text, stockName : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teams can buy stocks");
    };

    if (not isCallerTeamOwner(caller, teamName)) {
      Runtime.trap("Unauthorized: You can only trade for your own team");
    };

    if (not marketState.isOpen) {
      Runtime.trap("Market is closed");
    };

    let team = switch (teams.get(teamName)) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) { team };
    };

    let stock = switch (stocks.get(stockName)) {
      case (null) { Runtime.trap("Stock not found") };
      case (?stock) { stock };
    };

    let totalPrice = stock.price * quantity.toFloat();
    if (team.cash < totalPrice) {
      Runtime.trap("Insufficient funds");
    };

    team.cash := team.cash - totalPrice;

    let currentQuantity = switch (team.portfolio.get(stockName)) {
      case (null) { 0 };
      case (?qty) { qty };
    };

    team.portfolio.add(stockName, currentQuantity + quantity);
    updateTeamTotalValue(teamName);
  };

  public shared ({ caller }) func sellStock(teamName : Text, stockName : Text, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only teams can sell stocks");
    };

    if (not isCallerTeamOwner(caller, teamName)) {
      Runtime.trap("Unauthorized: You can only trade for your own team");
    };

    if (not marketState.isOpen) {
      Runtime.trap("Market is closed");
    };

    let team = switch (teams.get(teamName)) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) { team };
    };

    let stock = switch (stocks.get(stockName)) {
      case (null) { Runtime.trap("Stock not found") };
      case (?stock) { stock };
    };

    let currentQuantity = switch (team.portfolio.get(stockName)) {
      case (null) { 0 };
      case (?qty) { qty };
    };

    if (currentQuantity < quantity) {
      Runtime.trap("Insufficient stock quantity");
    };

    let totalPrice = stock.price * quantity.toFloat();
    team.cash := team.cash + totalPrice;

    let newQuantity = currentQuantity - quantity;
    if (newQuantity == 0) {
      team.portfolio.remove(stockName);
    } else {
      team.portfolio.add(stockName, newQuantity);
    };
    updateTeamTotalValue(teamName);
  };

  func updateTeamTotalValue(teamName : Text) {
    switch (teams.get(teamName)) {
      case (null) {};
      case (?team) {
        var total = team.cash;
        for ((stockName, qty) in team.portfolio.entries()) {
          let stockPrice = switch (stocks.get(stockName)) {
            case (null) { 0.0 };
            case (?s) { s.price };
          };
          total += stockPrice * qty.toFloat();
        };
        team.totalValue := total;
      };
    };
  };

  func isCallerTeamOwner(caller : Principal, teamName : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.teamName) {
          case (null) { false };
          case (?name) { name == teamName };
        };
      };
    };
  };

  func toStockView(stock : Stock) : StockView {
    {
      name = stock.name;
      price = stock.price;
      priceHistory = stock.priceHistory.toArray();
    };
  };

  func toTeamView(team : Team) : TeamView {
    {
      name = team.name;
      cash = team.cash;
      portfolio = team.portfolio.entries().toArray();
      totalValue = team.totalValue;
    };
  };

  public query func getStock(name : Text) : async ?StockView {
    switch (stocks.get(name)) {
      case (null) { null };
      case (?stock) { ?toStockView(stock) };
    };
  };

  public query func getAllStocks() : async [(Text, StockView)] {
    let stocksArray = stocks.entries().toArray();
    stocksArray.map<(Text, Stock), (Text, StockView)>(
      func((name, stock)) { (name, toStockView(stock)) }
    );
  };

  public query func getMarketState() : async { roundNumber : Nat; isOpen : Bool } {
    {
      roundNumber = marketState.roundNumber;
      isOpen = marketState.isOpen;
    };
  };

  public query func getAllNews() : async [(Nat, News)] {
    news.entries().toArray();
  };

  public query func getNews(newsId : Nat) : async ?News {
    news.get(newsId);
  };

  public query func getLatestNews() : async ?News {
    let newsArray = news.entries().toArray();
    if (newsArray.size() == 0) {
      return null;
    };
    let sorted = newsArray.sort(
      func(a, b) { Nat.compare(b.0, a.0) }
    );
    ?sorted[0].1;
  };

  public query ({ caller }) func getTeam(name : Text) : async ?TeamView {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      switch (teams.get(name)) {
        case (null) { return null };
        case (?team) { return ?toTeamView(team) };
      };
    };

    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      if (isCallerTeamOwner(caller, name)) {
        switch (teams.get(name)) {
          case (null) { return null };
          case (?team) { return ?toTeamView(team) };
        };
      };
    };

    Runtime.trap("Unauthorized: You can only view your own team's data");
  };

  public query ({ caller }) func getCallerTeam() : async ?TeamView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view team data");
    };

    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) {
        switch (profile.teamName) {
          case (null) { null };
          case (?teamName) {
            switch (teams.get(teamName)) {
              case (null) { null };
              case (?team) { ?toTeamView(team) };
            };
          };
        };
      };
    };
  };

  public query func getLeaderboard() : async [(Text, Float)] {
    let teamsArray = teams.entries().toArray();
    let sorted = teamsArray.sort(
      func(a, b) { Float.compare(b.1.totalValue, a.1.totalValue) }
    );
    sorted.map<(Text, Team), (Text, Float)>(
      func(entry) { (entry.0, entry.1.totalValue) }
    );
  };

  public query ({ caller }) func getAllTeams() : async [(Text, TeamView)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all teams");
    };
    let teamsArray = teams.entries().toArray();
    teamsArray.map<(Text, Team), (Text, TeamView)>(
      func((name, team)) { (name, toTeamView(team)) }
    );
  };

  public shared ({ caller }) func initialize() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only the admin can initialize the system");
    };
  };
};
